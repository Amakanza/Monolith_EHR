-- =============================================
-- MODULE 2 HARDENING MIGRATION
-- Fixes all identified issues with clinics/memberships
-- =============================================

-- 1. Add missing slug column to clinics table
alter table public.clinics 
add column if not exists slug text;

-- Create slug from name if it doesn't exist
update public.clinics 
set slug = lower(regexp_replace(name, '[^a-zA-Z0-9]', '-', 'g'))
where slug is null;

-- Add unique constraint on slug (with suffix handling)
DO $$
BEGIN
-- Handle potential duplicate slugs by adding suffixes
DO $$
BEGIN
    -- First, create a temporary table with row numbers for duplicates
    CREATE TEMP TABLE clinic_slug_updates AS
    SELECT 
        id,
        slug,
        row_number() OVER (PARTITION BY slug ORDER BY id) as row_num
    FROM public.clinics
    WHERE slug IS NOT NULL
    AND slug IN (
        SELECT slug 
        FROM public.clinics 
        WHERE slug IS NOT NULL
        GROUP BY slug 
        HAVING count(*) > 1
    );
    
    -- Update the clinics with suffixes (skip the first one with row_num = 1)
    UPDATE public.clinics c
    SET slug = c.slug || '-' || (csu.row_num - 1)::text
    FROM clinic_slug_updates csu
    WHERE c.id = csu.id 
    AND csu.row_num > 1;
    
    -- Drop the temporary table
    DROP TABLE clinic_slug_updates;
END $$;

-- Add unique constraint
alter table public.clinics 
add constraint clinics_slug_unique unique (slug);

-- 2. Ensure proper uniqueness constraints (should exist but verify)
alter table public.clinic_memberships 
add constraint clinic_memberships_unique unique (clinic_id, user_id);

-- 3. Fix role check constraint if needed
alter table public.clinic_memberships 
add constraint clinic_memberships_role_check check (role in ('owner','admin','clinician','receptionist'));

-- 4. Add helper functions with SECURITY DEFINER to avoid RLS recursion
drop function if exists public.is_member_of_clinic(uuid);
create or replace function public.is_member_of_clinic(_clinic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clinic_memberships m
    where m.clinic_id = _clinic_id
      and m.user_id = auth.uid()
  );
$$;

drop function if exists public.my_role_in_clinic(uuid);
create or replace function public.my_role_in_clinic(_clinic_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select m.role
  from public.clinic_memberships m
  where m.clinic_id = _clinic_id
    and m.user_id = auth.uid()
  limit 1;
$$;

drop function if exists public.is_clinic_admin(uuid);
create or replace function public.is_clinic_admin(_clinic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clinic_memberships m
    where m.clinic_id = _clinic_id
      and m.user_id = auth.uid()
      and m.role in ('owner','admin')
  );
$$;

-- Grant permissions
grant execute on function public.is_member_of_clinic(uuid) to authenticated;
grant execute on function public.my_role_in_clinic(uuid) to authenticated;
grant execute on function public.is_clinic_admin(uuid) to authenticated;

-- 5. Enhanced list_my_clinics RPC with role information
drop function if exists public.list_my_clinics();
create or replace function public.list_my_clinics()
returns table (
  id uuid,
  name text,
  timezone text,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  archived_at timestamptz,
  slug text,
  my_role text
)
language sql
stable
security definer
set search_path = public
as $$
  select 
    c.id,
    c.name,
    c.timezone,
    c.created_by,
    c.created_at,
    c.updated_at,
    c.archived_at,
    c.slug,
    cm.role as my_role
  from public.clinics c
  join public.clinic_memberships cm on cm.clinic_id = c.id
  where cm.user_id = auth.uid()
    and c.archived_at is null
  order by c.created_at desc;
$$;

grant execute on function public.list_my_clinics() to authenticated;

-- 6. Add RPC functions for member management
drop function if exists public.add_clinic_member(uuid, uuid, text);
create or replace function public.add_clinic_member(
  _clinic_id uuid,
  _user_id uuid,
  _role text default 'clinician'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_membership_id uuid;
  v_my_role text;
begin
  -- Verify user making request is admin/owner
  v_my_role := public.my_role_in_clinic(_clinic_id);
  if v_my_role not in ('owner', 'admin') then
    raise exception 'Only owners and admins can add members';
  end if;

  -- Only owners can add other owners
  if _role = 'owner' and v_my_role <> 'owner' then
    raise exception 'Only owners can add other owners';
  end if;

  -- Insert membership
  insert into public.clinic_memberships (clinic_id, user_id, role)
  values (_clinic_id, _user_id, _role)
  returning id into v_membership_id;

  return v_membership_id;
end;
$$;

grant execute on function public.add_clinic_member(uuid, uuid, text) to authenticated;

drop function if exists public.update_clinic_member_role(uuid, uuid, text);
create or replace function public.update_clinic_member_role(
  _clinic_id uuid,
  _user_id uuid,
  _new_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_my_role text;
  v_target_role text;
  v_is_self boolean;
begin
  -- Check permissions
  v_my_role := public.my_role_in_clinic(_clinic_id);
  if v_my_role not in ('owner', 'admin') then
    raise exception 'Only owners and admins can update member roles';
  end if;

  -- Only owners can promote to owner
  if _new_role = 'owner' and v_my_role <> 'owner' then
    raise exception 'Only owners can promote members to owner';
  end if;

  -- Get target user's current role
  select role into v_target_role
  from public.clinic_memberships
  where clinic_id = _clinic_id and user_id = _user_id;

  if v_target_role is null then
    raise exception 'User is not a member of this clinic';
  end if;

  -- Prevent self-demotion from owner
  v_is_self := (_user_id = auth.uid());
  if v_is_self and v_target_role = 'owner' and _new_role <> 'owner' then
    raise exception 'Cannot demote yourself from owner role';
  end if;

  -- Update the role
  update public.clinic_memberships
  set role = _new_role
  where clinic_id = _clinic_id and user_id = _user_id;
end;
$$;

grant execute on function public.update_clinic_member_role(uuid, uuid, text) to authenticated;

drop function if exists public.remove_clinic_member(uuid, uuid);
create or replace function public.remove_clinic_member(
  _clinic_id uuid,
  _user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_my_role text;
  v_target_role text;
  v_owners_count integer;
  v_is_self boolean;
begin
  -- Check permissions
  v_my_role := public.my_role_in_clinic(_clinic_id);
  if v_my_role not in ('owner', 'admin') then
    raise exception 'Only owners and admins can remove members';
  end if;

  -- Get target user's current role
  select role into v_target_role
  from public.clinic_memberships
  where clinic_id = _clinic_id and user_id = _user_id;

  if v_target_role is null then
    raise exception 'User is not a member of this clinic';
  end if;

  -- Prevent removing the last owner
  if v_target_role = 'owner' then
    select count(*) into v_owners_count
    from public.clinic_memberships
    where clinic_id = _clinic_id and role = 'owner';
    
    if v_owners_count <= 1 then
      raise exception 'Cannot remove the last owner of this clinic';
    end if;
  end if;

  -- Remove self restrictions
  v_is_self := (_user_id = auth.uid());
  if v_is_self and v_target_role = 'owner' then
    raise exception 'Cannot remove yourself from owner role';
  end if;

  -- Delete the membership
  delete from public.clinic_memberships
  where clinic_id = _clinic_id and user_id = _user_id;
end;
$$;

grant execute on function public.remove_clinic_member(uuid, uuid) to authenticated;

-- 7. Ensure proper RLS policies (recreate to avoid conflicts)
alter table public.clinics enable row level security;
alter table public.clinic_memberships enable row level security;

-- Drop existing policies
drop policy if exists "clinics_select_member" on public.clinics;
drop policy if exists "clinics_insert_authenticated" on public.clinics;
drop policy if exists "clinics_update_admin" on public.clinics;
drop policy if exists "clinics_delete_owner_only" on public.clinics;

-- Recreate clinics policies
create policy "clinics_select_member"
on public.clinics
for select
to authenticated
using (
  public.is_member_of_clinic(id)
);

create policy "clinics_insert_authenticated"
on public.clinics
for insert
to authenticated
with check (
  auth.uid() = created_by
);

create policy "clinics_update_admin"
on public.clinics
for update
to authenticated
using (
  public.is_clinic_admin(id)
)
with check (
  public.is_clinic_admin(id)
);

create policy "clinics_delete_owner_only"
on public.clinics
for delete
to authenticated
using (
  public.my_role_in_clinic(id) = 'owner'
);

-- Drop existing membership policies
drop policy if exists "memberships_select_member" on public.clinic_memberships;
drop policy if exists "memberships_insert_admin" on public.clinic_memberships;
drop policy if exists "memberships_update_admin" on public.clinic_memberships;
drop policy if exists "memberships_delete_admin" on public.clinic_memberships;

-- Recreate membership policies
create policy "memberships_select_member"
on public.clinic_memberships
for select
to authenticated
using (
  public.is_member_of_clinic(clinic_id)
);

create policy "memberships_insert_admin"
on public.clinic_memberships
for insert
to authenticated
with check (
  public.is_clinic_admin(clinic_id)
);

create policy "memberships_update_admin"
on public.clinic_memberships
for update
to authenticated
using (
  public.is_clinic_admin(clinic_id)
)
with check (
  public.is_clinic_admin(clinic_id)
);

create policy "memberships_delete_admin"
on public.clinic_memberships
for delete
to authenticated
using (
  public.is_clinic_admin(clinic_id)
);

-- 8. Ensure user_profiles has active_clinic_id column
alter table public.user_profiles 
add column if not exists active_clinic_id uuid null references public.clinics(id) on delete set null;

-- Create index for active_clinic_id
create index if not exists idx_user_profiles_active_clinic_id
on public.user_profiles(active_clinic_id);

-- 9. Add constraint to ensure user can only set active_clinic_id to clinic they belong to
drop function if exists public.enforce_active_clinic_membership();
create or replace function public.enforce_active_clinic_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if new.id <> auth.uid() then
    raise exception 'Cannot change another user profile';
  end if;

  if new.active_clinic_id is not null and not public.is_member_of_clinic(new.active_clinic_id) then
    raise exception 'active_clinic_id must be a clinic you belong to';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_active_clinic_membership on public.user_profiles;
create trigger trg_enforce_active_clinic_membership
before update of active_clinic_id on public.user_profiles
for each row
execute function public.enforce_active_clinic_membership();

-- 10. Ensure user_profiles RLS allows updating own active_clinic_id
drop policy if exists "user_profiles_update_self" on public.user_profiles;
create policy "user_profiles_update_self"
on public.user_profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- 11. Add set_active_clinic RPC
drop function if exists public.set_active_clinic(uuid);
create or replace function public.set_active_clinic(_clinic_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if _clinic_id is not null and not public.is_member_of_clinic(_clinic_id) then
    raise exception 'You are not a member of this clinic';
  end if;

  update public.user_profiles
  set active_clinic_id = _clinic_id
  where id = auth.uid();
end;
$$;

grant execute on function public.set_active_clinic(uuid) to authenticated;
create extension if not exists "pgcrypto";

-- -------------------------------------------------
-- 0) Assumptions (matches Module 1 common pattern)
-- -------------------------------------------------
-- Assumes public.user_profiles.id is the same UUID as auth.users.id (auth.uid()).

-- -------------------------------------------------
-- 1) Clinics table
-- -------------------------------------------------
create table if not exists public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'Africa/Windhoek',
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null
);

create index if not exists idx_clinics_created_by
on public.clinics (created_by);

-- updated_at trigger (expects public.set_updated_at() created in Module 1)
drop trigger if exists trg_clinics_updated_at on public.clinics;
create trigger trg_clinics_updated_at
before update on public.clinics
for each row
execute function public.set_updated_at();

-- -------------------------------------------------
-- 2) Clinic memberships table
-- -------------------------------------------------
create table if not exists public.clinic_memberships (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinic_memberships_role_check check (role in ('owner','admin','clinician','receptionist')),
  constraint clinic_memberships_unique unique (clinic_id, user_id)
);

create index if not exists idx_clinic_memberships_user_id
on public.clinic_memberships (user_id);

create index if not exists idx_clinic_memberships_clinic_id
on public.clinic_memberships (clinic_id);

drop trigger if exists trg_clinic_memberships_updated_at on public.clinic_memberships;
create trigger trg_clinic_memberships_updated_at
before update on public.clinic_memberships
for each row
execute function public.set_updated_at();

-- -------------------------------------------------
-- 3) Active clinic support (stored on user_profiles)
-- -------------------------------------------------
alter table public.user_profiles
add column if not exists active_clinic_id uuid null references public.clinics(id) on delete set null;

create index if not exists idx_user_profiles_active_clinic_id
on public.user_profiles (active_clinic_id);

-- -------------------------------------------------
-- 4) Helper functions
-- -------------------------------------------------
create or replace function public.is_member_of_clinic(_clinic_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.clinic_memberships m
    where m.clinic_id = _clinic_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.my_role_in_clinic(_clinic_id uuid)
returns text
language sql
stable
as $$
  select m.role
  from public.clinic_memberships m
  where m.clinic_id = _clinic_id
    and m.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_clinic_admin(_clinic_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.clinic_memberships m
    where m.clinic_id = _clinic_id
      and m.user_id = auth.uid()
      and m.role in ('owner','admin')
  );
$$;

-- -------------------------------------------------
-- 5) RPC: atomic clinic creation (clinic + owner membership + active clinic)
-- -------------------------------------------------
create or replace function public.create_clinic_with_owner(
  _name text,
  _timezone text default 'Africa/Windhoek'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clinic_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.clinics (name, timezone, created_by)
  values (_name, coalesce(nullif(_timezone, ''), 'Africa/Windhoek'), auth.uid())
  returning id into v_clinic_id;

  insert into public.clinic_memberships (clinic_id, user_id, role)
  values (v_clinic_id, auth.uid(), 'owner');

  update public.user_profiles
  set active_clinic_id = v_clinic_id
  where id = auth.uid();

  return v_clinic_id;
end;
$$;

revoke all on function public.create_clinic_with_owner(text, text) from public;
grant execute on function public.create_clinic_with_owner(text, text) to authenticated;

-- -------------------------------------------------
-- 6) "Last owner" safeguard
--    Prevent removing/demoting the final owner of a clinic
-- -------------------------------------------------
create or replace function public.prevent_last_owner_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owners_count integer;
  v_clinic uuid;
  v_old_role text;
  v_new_role text;
begin
  v_clinic := coalesce(old.clinic_id, new.clinic_id);
  v_old_role := old.role;
  v_new_role := coalesce(new.role, old.role);

  -- Only relevant if the affected row is an owner AND we are removing/demoting them
  if v_old_role = 'owner' then
    if tg_op = 'DELETE' or (tg_op = 'UPDATE' and v_new_role <> 'owner') then
      select count(*) into v_owners_count
      from public.clinic_memberships
      where clinic_id = v_clinic
        and role = 'owner';

      if v_owners_count <= 1 then
        raise exception 'Cannot remove or demote the last owner of this clinic';
      end if;
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_last_owner_change on public.clinic_memberships;
create trigger trg_prevent_last_owner_change
before update or delete on public.clinic_memberships
for each row
execute function public.prevent_last_owner_change();

-- -------------------------------------------------
-- 7) RLS: enable and policies
-- -------------------------------------------------
alter table public.clinics enable row level security;
alter table public.clinic_memberships enable row level security;

-- ---- Clinics policies ----
drop policy if exists "clinics_select_member" on public.clinics;
create policy "clinics_select_member"
on public.clinics
for select
to authenticated
using (
  public.is_member_of_clinic(id)
);

drop policy if exists "clinics_insert_authenticated" on public.clinics;
create policy "clinics_insert_authenticated"
on public.clinics
for insert
to authenticated
with check (
  auth.uid() = created_by
);

drop policy if exists "clinics_update_admin" on public.clinics;
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

-- Optional: only owner/admin can archive (update archived_at)
-- This is already covered by update_admin above.

drop policy if exists "clinics_delete_owner_only" on public.clinics;
create policy "clinics_delete_owner_only"
on public.clinics
for delete
to authenticated
using (
  public.my_role_in_clinic(id) = 'owner'
);

-- ---- Clinic memberships policies ----
drop policy if exists "memberships_select_member" on public.clinic_memberships;
create policy "memberships_select_member"
on public.clinic_memberships
for select
to authenticated
using (
  public.is_member_of_clinic(clinic_id)
);

-- Admin/Owner can add members
drop policy if exists "memberships_insert_admin" on public.clinic_memberships;
create policy "memberships_insert_admin"
on public.clinic_memberships
for insert
to authenticated
with check (
  public.is_clinic_admin(clinic_id)
);

-- Admin/Owner can update members (roles etc.)
drop policy if exists "memberships_update_admin" on public.clinic_memberships;
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

-- Admin/Owner can remove members
drop policy if exists "memberships_delete_admin" on public.clinic_memberships;
create policy "memberships_delete_admin"
on public.clinic_memberships
for delete
to authenticated
using (
  public.is_clinic_admin(clinic_id)
);

-- -------------------------------------------------
-- 8) Allow users to set their own active clinic (optional)
-- -------------------------------------------------
-- This assumes Module 1 already created RLS policies on user_profiles that allow a user
-- to update their own row. If not, add the below policy snippet.

-- Example (uncomment only if you don't already have it in Module 1):
-- alter table public.user_profiles enable row level security;
-- drop policy if exists "user_profiles_update_self" on public.user_profiles;
-- create policy "user_profiles_update_self"
-- on public.user_profiles
-- for update
-- to authenticated
-- using (id = auth.uid())
-- with check (id = auth.uid());

-- Tighten: user can only set active_clinic_id to a clinic they belong to
create or replace function public.can_set_active_clinic(_clinic_id uuid)
returns boolean
language sql
stable
as $$
  select _clinic_id is null
     or exists (
        select 1
        from public.clinic_memberships m
        where m.clinic_id = _clinic_id
          and m.user_id = auth.uid()
     );
$$;

-- Add a constraint trigger to enforce membership on active_clinic_id
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

  if not public.can_set_active_clinic(new.active_clinic_id) then
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

-- Done


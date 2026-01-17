-- Simplified Module 2 Migration (Step 3: RPC Functions)
-- Run this after step 2 completes successfully

-- 1. Enhanced list_my_clinics RPC with role information
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

-- 2. set_active_clinic RPC
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
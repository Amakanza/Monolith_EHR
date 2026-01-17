-- Simplified Module 2 Migration (Step 2: Functions & RLS)
-- Run this after step 1 completes successfully

-- 1. Drop existing functions to avoid conflicts
drop function if exists public.is_member_of_clinic(uuid);
drop function if exists public.my_role_in_clinic(uuid);
drop function if exists public.is_clinic_admin(uuid);

-- 2. Create helper functions with SECURITY DEFINER
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

-- 3. Grant permissions
grant execute on function public.is_member_of_clinic(uuid) to authenticated;
grant execute on function public.my_role_in_clinic(uuid) to authenticated;
grant execute on function public.is_clinic_admin(uuid) to authenticated;
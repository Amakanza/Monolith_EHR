-- =============================================
-- FIX: Circular RLS dependency in helper functions
-- Run this migration to fix the stack overflow error
-- =============================================

-- 1. Drop and recreate is_member_of_clinic with SECURITY DEFINER
create or replace function public.is_member_of_clinic(_clinic_id uuid)
returns boolean
language sql
stable
security definer  -- THIS IS THE KEY FIX
set search_path = public
as $$
  select exists (
    select 1
    from public.clinic_memberships m
    where m.clinic_id = _clinic_id
      and m.user_id = auth.uid()
  );
$$;

-- 2. Also fix my_role_in_clinic
create or replace function public.my_role_in_clinic(_clinic_id uuid)
returns text
language sql
stable
security definer  -- Add this
set search_path = public
as $$
  select m.role
  from public.clinic_memberships m
  where m.clinic_id = _clinic_id
    and m.user_id = auth.uid()
  limit 1;
$$;

-- 3. Also fix is_clinic_admin
create or replace function public.is_clinic_admin(_clinic_id uuid)
returns boolean
language sql
stable
security definer  -- Add this
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

-- 4. Grant execute permissions to authenticated users
grant execute on function public.is_member_of_clinic(uuid) to authenticated;
grant execute on function public.my_role_in_clinic(uuid) to authenticated;
grant execute on function public.is_clinic_admin(uuid) to authenticated;
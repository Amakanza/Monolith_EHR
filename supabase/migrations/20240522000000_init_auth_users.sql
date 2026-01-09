-- =============================================
-- Module 1: Auth & Users
-- Creates public.user_profiles linked 1:1 to auth.users
-- =============================================

-- 1. Create user_profiles table
create table if not exists public.user_profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text,
    global_role text not null default 'standard_user',
    avatar_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 2. Add constraint for allowed global_role values
do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'user_profiles_global_role_check'
    ) then
        alter table public.user_profiles
        add constraint user_profiles_global_role_check
        check (global_role in ('super_admin', 'standard_user'));
    end if;
end $$;

-- 3. Index for admin / future dashboards
create index if not exists idx_user_profiles_global_role
on public.user_profiles (global_role);

-- 4. updated_at trigger function
create or replace function public.set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- 5. Attach updated_at trigger
drop trigger if exists trg_user_profiles_updated_at on public.user_profiles;

create trigger trg_user_profiles_updated_at
before update on public.user_profiles
for each row
execute function public.set_updated_at();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

alter table public.user_profiles enable row level security;

-- 6. Select: users can read their own profile
drop policy if exists "User can view own profile" on public.user_profiles;

create policy "User can view own profile"
on public.user_profiles
for select
using (auth.uid() = id);

-- 7. Insert: users can insert their own profile
-- (used during signup via service layer)
drop policy if exists "User can insert own profile" on public.user_profiles;

create policy "User can insert own profile"
on public.user_profiles
for insert
with check (auth.uid() = id);

-- 8. Update: users can update their own profile
drop policy if exists "User can update own profile" on public.user_profiles;

create policy "User can update own profile"
on public.user_profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- =============================================
-- OPTIONAL: FAILSAFE PROFILE CREATION TRIGGER
-- (SAFE + IDEMPOTENT)
-- =============================================
-- This trigger ONLY creates a profile if one does not exist.
-- Your authService SHOULD still create profiles explicitly
-- so full_name is preserved.

create or replace function public.handle_new_auth_user()
returns trigger as $$
begin
    insert into public.user_profiles (id)
    values (new.id)
    on conflict (id) do nothing;
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_auth_user_created on auth.users;

create trigger trg_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

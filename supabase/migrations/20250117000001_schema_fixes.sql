-- Simplified Module 2 Migration (Step 1: Schema Fixes)
-- Run this first if the full migration fails

-- 1. Add missing slug column
alter table public.clinics 
add column if not exists slug text;

-- Create slug from name if it doesn't exist
update public.clinics 
set slug = lower(regexp_replace(name, '[^a-zA-Z0-9]', '-', 'g'))
where slug is null;

-- 2. Ensure user_profiles has active_clinic_id column
alter table public.user_profiles 
add column if not exists active_clinic_id uuid null references public.clinics(id) on delete set null;

-- 3. Create index for active_clinic_id
create index if not exists idx_user_profiles_active_clinic_id
on public.user_profiles(active_clinic_id);

-- 4. Add unique constraint on slug (may fail if duplicates exist)
-- Uncomment after handling duplicates: alter table public.clinics add constraint clinics_slug_unique unique (slug);
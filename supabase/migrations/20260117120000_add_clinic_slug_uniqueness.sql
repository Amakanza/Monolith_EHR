-- =============================================
-- ADD: Unique slug functionality for clinics
-- Prevents duplicate clinic names and provides URL-friendly slugs
-- =============================================

-- 1. Add slug column to clinics table
alter table public.clinics 
add column if not exists slug text;

-- 2. Create unique constraint on slug
alter table public.clinics 
add constraint clinics_slug_unique unique (slug);

-- 3. Create index for slug lookups
create index if not exists idx_clinics_slug 
on public.clinics (slug);

-- 4. Create slug generation function
create or replace function public.generate_clinic_slug(_name text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base_slug text;
  v_slug text;
  v_counter integer := 1;
  v_exists boolean;
begin
  -- Generate base slug from name
  v_base_slug := lower(regexp_replace(_name, '[^a-zA-Z0-9\s-]', '', 'g'));
  v_base_slug := regexp_replace(v_base_slug, '\s+', '-', 'g');
  v_base_slug := regexp_replace(v_base_slug, '-+', '-', 'g');
  v_base_slug := trim(both '-' from v_base_slug);
  
  -- If base slug is empty, use a default
  if v_base_slug = '' then
    v_base_slug := 'clinic';
  end if;
  
  -- Start with base slug
  v_slug := v_base_slug;
  
  -- Check if slug exists, if so append counter
  loop
    select exists(
      select 1 
      from public.clinics 
      where slug = v_slug
    ) into v_exists;
    
    exit when not v_exists;
    
    v_slug := v_base_slug || '-' || v_counter;
    v_counter := v_counter + 1;
    
    -- Safety check to prevent infinite loop
    if v_counter > 1000 then
      raise exception 'Unable to generate unique slug for clinic name: %', _name;
    end if;
  end loop;
  
  return v_slug;
end;
$$;

-- 5. Create trigger to auto-generate slug on insert
create or replace function public.set_clinic_slug()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only generate slug if it's not provided
  if new.slug is null or new.slug = '' then
    new.slug := public.generate_clinic_slug(new.name);
  end if;
  
  return new;
end;
$$;

-- 6. Add trigger for auto slug generation
drop trigger if exists trg_set_clinic_slug on public.clinics;
create trigger trg_set_clinic_slug
before insert on public.clinics
for each row
execute function public.set_clinic_slug();

-- 7. Update existing clinics to have slugs
update public.clinics 
set slug = public.generate_clinic_slug(name) 
where slug is null or slug = '';

-- 8. Add slug to RLS policies (allow reading by slug)
drop policy if exists "clinics_select_by_slug" on public.clinics;
create policy "clinics_select_by_slug"
on public.clinics
for select
to authenticated
using (
  slug is not null and public.is_member_of_clinic(id)
);

-- 9. Grant execute permissions
grant execute on function public.generate_clinic_slug(text) to authenticated;
grant execute on function public.set_clinic_slug() to authenticated;

-- 10. Add function to find clinic by slug (useful for public booking)
create or replace function public.get_clinic_by_slug(_slug text)
returns table (
  id uuid,
  name text,
  timezone text,
  created_at timestamptz
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
    c.created_at
  from public.clinics c
  where c.slug = _slug
    and c.archived_at is null;
$$;

grant execute on function public.get_clinic_by_slug(text) to authenticated;
grant execute on function public.get_clinic_by_slug(text) to anon;
create extension if not exists "pgcrypto";

-- -------------------------------------------------
-- 1) Patients table (treated person)
-- -------------------------------------------------
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,

  first_name text not null,
  last_name text not null,
  date_of_birth date null,
  gender text null,
  id_number text null,
  passport_number text null,

  dependent_code text null,

  cell_number text null,
  tel_number text null,
  email text null,

  postal_address text null,
  address_city text null,

  occupation text null,

  file_number text null,

  archived_at timestamptz null,

  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint patients_gender_check
    check (gender is null or gender in ('male','female','other','unknown'))
);

-- Indexes
create index if not exists idx_patients_clinic_id on public.patients (clinic_id);
create index if not exists idx_patients_last_name on public.patients (last_name);
create index if not exists idx_patients_cell_number on public.patients (cell_number);
create index if not exists idx_patients_tel_number on public.patients (tel_number);
create index if not exists idx_patients_email on public.patients (email);
create index if not exists idx_patients_id_number on public.patients (id_number);
create index if not exists idx_patients_file_number on public.patients (file_number);
create index if not exists idx_patients_archived_at on public.patients (archived_at);

-- Partial unique index: file_number unique within clinic when present
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'uq_patients_clinic_file_number_not_null'
  ) then
    execute 'create unique index uq_patients_clinic_file_number_not_null
             on public.patients (clinic_id, file_number)
             where file_number is not null';
  end if;
end $$;

-- updated_at trigger (reuses public.set_updated_at() from Module 1)
drop trigger if exists trg_patients_updated_at on public.patients;
create trigger trg_patients_updated_at
before update on public.patients
for each row
execute function public.set_updated_at();


-- -------------------------------------------------
-- 2) Patient membership table (main member + medical aid)
-- -------------------------------------------------
create table if not exists public.patient_membership (
  id uuid primary key default gen_random_uuid(),

  patient_id uuid not null unique references public.patients(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,

  funding_type text null,
  medical_aid_name text null,
  medical_aid_plan text null,
  medical_aid_number text null,

  patient_is_main_member boolean not null default true,

  main_member_first_name text null,
  main_member_last_name text null,
  main_member_id_number text null,
  main_member_passport_number text null,
  main_member_cell_number text null,
  main_member_tel_number text null,
  main_member_occupation text null,

  main_member_employer text null,
  main_member_employer_contact text null,

  main_member_postal_address text null,

  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint patient_membership_funding_type_check
    check (funding_type is null or funding_type in ('medical_aid','cash','company','other'))
);

create index if not exists idx_patient_membership_clinic_id on public.patient_membership (clinic_id);
create index if not exists idx_patient_membership_patient_id on public.patient_membership (patient_id);
create index if not exists idx_patient_membership_med_aid_number on public.patient_membership (medical_aid_number);

drop trigger if exists trg_patient_membership_updated_at on public.patient_membership;
create trigger trg_patient_membership_updated_at
before update on public.patient_membership
for each row
execute function public.set_updated_at();


-- -------------------------------------------------
-- 3) RLS policies
-- -------------------------------------------------

-- Patients RLS
alter table public.patients enable row level security;

drop policy if exists "Patients: clinic members can read" on public.patients;
create policy "Patients: clinic members can read"
on public.patients
for select
using (public.is_member_of_clinic(clinic_id));

drop policy if exists "Patients: clinic members can insert" on public.patients;
create policy "Patients: clinic members can insert"
on public.patients
for insert
with check (
  public.is_member_of_clinic(clinic_id)
  and created_by = auth.uid()
);

drop policy if exists "Patients: clinic members can update" on public.patients;
create policy "Patients: clinic members can update"
on public.patients
for update
using (public.is_member_of_clinic(clinic_id))
with check (public.is_member_of_clinic(clinic_id));

-- No DELETE policy (soft archive only)


-- Patient membership RLS
alter table public.patient_membership enable row level security;

drop policy if exists "PatientMembership: clinic members can read" on public.patient_membership;
create policy "PatientMembership: clinic members can read"
on public.patient_membership
for select
using (public.is_member_of_clinic(clinic_id));

drop policy if exists "PatientMembership: clinic members can insert" on public.patient_membership;
create policy "PatientMembership: clinic members can insert"
on public.patient_membership
for insert
with check (
  public.is_member_of_clinic(clinic_id)
  and created_by = auth.uid()
);

drop policy if exists "PatientMembership: clinic members can update" on public.patient_membership;
create policy "PatientMembership: clinic members can update"
on public.patient_membership
for update
using (public.is_member_of_clinic(clinic_id))
with check (public.is_member_of_clinic(clinic_id));

-- No DELETE policy


-- END


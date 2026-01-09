create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

-- -------------------------------------------------
-- 1) Appointment types
-- -------------------------------------------------
create table if not exists public.appointment_types (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null,
  default_duration_minutes int not null default 30,
  color text null,
  is_active boolean not null default true,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointment_types_duration_check check (default_duration_minutes between 5 and 480)
);

create index if not exists idx_appointment_types_clinic_id on public.appointment_types (clinic_id);
create index if not exists idx_appointment_types_is_active on public.appointment_types (is_active);

-- Unique type names per clinic (case-insensitive)
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'uq_appointment_types_clinic_name'
  ) then
    execute 'create unique index uq_appointment_types_clinic_name
             on public.appointment_types (clinic_id, lower(name))';
  end if;
end $$;

drop trigger if exists trg_appointment_types_updated_at on public.appointment_types;
create trigger trg_appointment_types_updated_at
before update on public.appointment_types
for each row
execute function public.set_updated_at();

-- -------------------------------------------------
-- 2) Appointments
-- -------------------------------------------------
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,

  patient_id uuid not null references public.patients(id) on delete restrict,
  clinician_id uuid not null references public.user_profiles(id) on delete restrict,
  appointment_type_id uuid null references public.appointment_types(id) on delete set null,

  start_time timestamptz not null,
  end_time timestamptz not null,
  timezone text not null default 'Africa/Windhoek',

  status text not null default 'booked',
  cancellation_reason text null,
  cancelled_at timestamptz null,
  completed_at timestamptz null,
  no_show_at timestamptz null,

  internal_note text null,

  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint appointments_time_check check (end_time > start_time),
  constraint appointments_status_check check (status in ('booked','cancelled','completed','no_show'))
);

create index if not exists idx_appointments_clinic_start on public.appointments (clinic_id, start_time);
create index if not exists idx_appointments_clinician_start on public.appointments (clinician_id, start_time);
create index if not exists idx_appointments_patient_start on public.appointments (patient_id, start_time);
create index if not exists idx_appointments_status on public.appointments (status);

drop trigger if exists trg_appointments_updated_at on public.appointments;
create trigger trg_appointments_updated_at
before update on public.appointments
for each row
execute function public.set_updated_at();

-- -------------------------------------------------
-- 3) Double-booking prevention (DB enforced)
-- Prevent overlaps for same clinician when status='booked'
-- FIX: use tstzrange (NOT tsrange) because start_time/end_time are timestamptz
-- -------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'appointments_no_overlap_booked'
  ) then
    execute '
      alter table public.appointments
      add constraint appointments_no_overlap_booked
      exclude using gist (
        clinician_id with =,
        tstzrange(start_time, end_time, ''[)'') with &&
      )
      where (status = ''booked'')
    ';
  end if;
end $$;

-- -------------------------------------------------
-- 4) RLS policies
-- -------------------------------------------------

-- appointment_types RLS
alter table public.appointment_types enable row level security;

drop policy if exists "AppointmentTypes: clinic members can read" on public.appointment_types;
create policy "AppointmentTypes: clinic members can read"
on public.appointment_types
for select
to authenticated
using (public.is_member_of_clinic(clinic_id));

drop policy if exists "AppointmentTypes: clinic members can insert" on public.appointment_types;
create policy "AppointmentTypes: clinic members can insert"
on public.appointment_types
for insert
to authenticated
with check (
  public.is_member_of_clinic(clinic_id)
  and created_by = auth.uid()
);

drop policy if exists "AppointmentTypes: clinic members can update" on public.appointment_types;
create policy "AppointmentTypes: clinic members can update"
on public.appointment_types
for update
to authenticated
using (public.is_member_of_clinic(clinic_id))
with check (public.is_member_of_clinic(clinic_id));

-- No delete policy (deactivate instead)

-- appointments RLS
alter table public.appointments enable row level security;

drop policy if exists "Appointments: clinic members can read" on public.appointments;
create policy "Appointments: clinic members can read"
on public.appointments
for select
to authenticated
using (public.is_member_of_clinic(clinic_id));

drop policy if exists "Appointments: clinic members can insert" on public.appointments;
create policy "Appointments: clinic members can insert"
on public.appointments
for insert
to authenticated
with check (
  public.is_member_of_clinic(clinic_id)
  and created_by = auth.uid()
);

drop policy if exists "Appointments: clinic members can update" on public.appointments;
create policy "Appointments: clinic members can update"
on public.appointments
for update
to authenticated
using (public.is_member_of_clinic(clinic_id))
with check (public.is_member_of_clinic(clinic_id));

-- No delete policy (keep audit trail)

-- END


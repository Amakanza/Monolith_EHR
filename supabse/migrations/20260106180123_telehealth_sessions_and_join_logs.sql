create extension if not exists "pgcrypto";

-- -------------------------------------------------
-- 1) Telehealth sessions (1:1 with appointment)
-- -------------------------------------------------
create table if not exists public.telehealth_sessions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,

  appointment_id uuid not null unique references public.appointments(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  clinician_id uuid not null references public.user_profiles(id) on delete restrict,

  provider text not null,
  join_url text not null,
  host_url text null,
  meeting_id text null,
  passcode text null,

  patient_join_token text null unique,
  patient_join_expires_at timestamptz null,
  is_active boolean not null default true,

  status text not null default 'scheduled',
  started_at timestamptz null,
  ended_at timestamptz null,

  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint telehealth_sessions_provider_check
    check (provider in ('zoom','google_meet','microsoft_teams','jitsi','custom')),

  constraint telehealth_sessions_status_check
    check (status in ('scheduled','live','ended','cancelled'))
);

create index if not exists idx_telehealth_sessions_clinic_id
on public.telehealth_sessions (clinic_id);

create index if not exists idx_telehealth_sessions_patient_id
on public.telehealth_sessions (patient_id);

create index if not exists idx_telehealth_sessions_clinician_id
on public.telehealth_sessions (clinician_id);

create index if not exists idx_telehealth_sessions_status
on public.telehealth_sessions (status);

drop trigger if exists trg_telehealth_sessions_updated_at on public.telehealth_sessions;
create trigger trg_telehealth_sessions_updated_at
before update on public.telehealth_sessions
for each row
execute function public.set_updated_at();


-- -------------------------------------------------
-- 2) Join logs
-- -------------------------------------------------
create table if not exists public.telehealth_join_logs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  session_id uuid not null references public.telehealth_sessions(id) on delete cascade,

  joined_at timestamptz not null default now(),

  actor_type text not null,
  actor_user_id uuid null references public.user_profiles(id) on delete set null,

  patient_token_used text null,
  ip_hash text null,
  user_agent text null,

  status text not null default 'success',
  error text null,

  constraint telehealth_join_logs_actor_type_check
    check (actor_type in ('patient','staff')),

  constraint telehealth_join_logs_status_check
    check (status in ('success','denied','error'))
);

create index if not exists idx_telehealth_join_logs_session_joined
on public.telehealth_join_logs (session_id, joined_at desc);


-- -------------------------------------------------
-- 3) RLS
-- -------------------------------------------------

-- telehealth_sessions RLS
alter table public.telehealth_sessions enable row level security;

drop policy if exists "TelehealthSessions: clinic members can read" on public.telehealth_sessions;
create policy "TelehealthSessions: clinic members can read"
on public.telehealth_sessions
for select
using (public.is_member_of_clinic(clinic_id));

drop policy if exists "TelehealthSessions: clinic members can insert" on public.telehealth_sessions;
create policy "TelehealthSessions: clinic members can insert"
on public.telehealth_sessions
for insert
with check (
  public.is_member_of_clinic(clinic_id)
  and created_by = auth.uid()
);

drop policy if exists "TelehealthSessions: clinic members can update" on public.telehealth_sessions;
create policy "TelehealthSessions: clinic members can update"
on public.telehealth_sessions
for update
using (public.is_member_of_clinic(clinic_id))
with check (public.is_member_of_clinic(clinic_id));

-- No delete policy


-- telehealth_join_logs RLS
alter table public.telehealth_join_logs enable row level security;

drop policy if exists "TelehealthJoinLogs: clinic members can read" on public.telehealth_join_logs;
create policy "TelehealthJoinLogs: clinic members can read"
on public.telehealth_join_logs
for select
using (public.is_member_of_clinic(clinic_id));

drop policy if exists "TelehealthJoinLogs: clinic members can insert" on public.telehealth_join_logs;
create policy "TelehealthJoinLogs: clinic members can insert"
on public.telehealth_join_logs
for insert
with check (public.is_member_of_clinic(clinic_id));

-- No update/delete policies (logs are append-only)

-- END


create extension if not exists "pgcrypto";

-- -------------------------------------------------
-- 1) Audit events
-- -------------------------------------------------
create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,

  actor_user_id uuid not null references public.user_profiles(id) on delete restrict,
  actor_role text null,

  event_type text not null,     -- e.g. 'patient.created'
  entity_type text not null,    -- e.g. 'patient'
  entity_id uuid null,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

-- Indexes for fast filtering
create index if not exists idx_audit_events_clinic_created
on public.audit_events (clinic_id, created_at desc);

create index if not exists idx_audit_events_actor_created
on public.audit_events (actor_user_id, created_at desc);

create index if not exists idx_audit_events_event_type
on public.audit_events (event_type);

create index if not exists idx_audit_events_entity
on public.audit_events (entity_type, entity_id);

-- -------------------------------------------------
-- 2) RLS
-- -------------------------------------------------
alter table public.audit_events enable row level security;

-- Read: clinic members (v1; can tighten to admin/owner later)
drop policy if exists "AuditEvents: clinic members can read" on public.audit_events;
create policy "AuditEvents: clinic members can read"
on public.audit_events
for select
using (public.is_member_of_clinic(clinic_id));

-- Insert: clinic members; actor must be current user
drop policy if exists "AuditEvents: clinic members can insert" on public.audit_events;
create policy "AuditEvents: clinic members can insert"
on public.audit_events
for insert
with check (
  public.is_member_of_clinic(clinic_id)
  and actor_user_id = auth.uid()
);

-- No update/delete policies (append-only log)

-- END


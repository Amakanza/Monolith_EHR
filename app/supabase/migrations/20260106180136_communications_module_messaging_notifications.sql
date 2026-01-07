create extension if not exists "pgcrypto";

-- -------------------------------------------------
-- 1) Message templates (per clinic)
-- -------------------------------------------------
create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null,
  channel text not null,
  subject text null,
  body text not null,
  is_active boolean not null default true,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint message_templates_channel_check
    check (channel in ('sms','email','whatsapp','in_app'))
);

create index if not exists idx_message_templates_clinic_id
on public.message_templates (clinic_id);

create index if not exists idx_message_templates_is_active
on public.message_templates (is_active);

do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname='public' and indexname='uq_message_templates_clinic_name'
  ) then
    execute 'create unique index uq_message_templates_clinic_name
             on public.message_templates (clinic_id, lower(name))';
  end if;
end $$;

drop trigger if exists trg_message_templates_updated_at on public.message_templates;
create trigger trg_message_templates_updated_at
before update on public.message_templates
for each row
execute function public.set_updated_at();


-- -------------------------------------------------
-- 2) Outbound messages
-- -------------------------------------------------
create table if not exists public.outbound_messages (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,

  patient_id uuid null references public.patients(id) on delete set null,
  appointment_id uuid null references public.appointments(id) on delete set null,
  invoice_id uuid null references public.invoices(id) on delete set null,

  recipient_name text null,
  recipient_contact text null,

  channel text not null,
  subject text null,
  body text not null,

  planned_send_at timestamptz null,
  send_after_event text null,

  status text not null default 'queued',
  sent_at timestamptz null,
  failed_at timestamptz null,
  failure_reason text null,
  cancelled_at timestamptz null,

  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint outbound_messages_channel_check
    check (channel in ('sms','email','whatsapp')),

  constraint outbound_messages_status_check
    check (status in ('queued','sending','sent','failed','cancelled')),

  constraint outbound_messages_send_after_event_check
    check (
      send_after_event is null
      or send_after_event in ('appointment_created','appointment_booked','appointment_upcoming','invoice_sent')
    )
);

create index if not exists idx_outbound_messages_clinic_planned
on public.outbound_messages (clinic_id, planned_send_at);

create index if not exists idx_outbound_messages_status
on public.outbound_messages (status);

create index if not exists idx_outbound_messages_patient_id
on public.outbound_messages (patient_id);

create index if not exists idx_outbound_messages_appointment_id
on public.outbound_messages (appointment_id);

drop trigger if exists trg_outbound_messages_updated_at on public.outbound_messages;
create trigger trg_outbound_messages_updated_at
before update on public.outbound_messages
for each row
execute function public.set_updated_at();


-- -------------------------------------------------
-- 3) Delivery attempts log
-- -------------------------------------------------
create table if not exists public.message_delivery_attempts (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  message_id uuid not null references public.outbound_messages(id) on delete cascade,

  attempt_number int not null default 1,
  attempted_at timestamptz not null default now(),

  provider text null,
  provider_message_id text null,

  status text not null,
  error text null,

  constraint message_delivery_attempts_status_check
    check (status in ('sent','failed')),

  constraint message_delivery_attempts_attempt_number_check
    check (attempt_number >= 1)
);

create index if not exists idx_delivery_attempts_message_id
on public.message_delivery_attempts (message_id);


-- -------------------------------------------------
-- 4) Staff notifications (in-app)
-- -------------------------------------------------
create table if not exists public.staff_notifications (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,

  title text not null,
  body text null,
  link_url text null,

  status text not null default 'unread',
  created_at timestamptz not null default now(),
  read_at timestamptz null,

  constraint staff_notifications_status_check
    check (status in ('unread','read'))
);

create index if not exists idx_staff_notifications_user_created
on public.staff_notifications (user_id, created_at desc);

create index if not exists idx_staff_notifications_status
on public.staff_notifications (status);


-- -------------------------------------------------
-- 5) RLS
-- -------------------------------------------------

-- message_templates RLS
alter table public.message_templates enable row level security;

drop policy if exists "MessageTemplates: clinic members can read" on public.message_templates;
create policy "MessageTemplates: clinic members can read"
on public.message_templates
for select
using (public.is_member_of_clinic(clinic_id));

drop policy if exists "MessageTemplates: clinic members can insert" on public.message_templates;
create policy "MessageTemplates: clinic members can insert"
on public.message_templates
for insert
with check (
  public.is_member_of_clinic(clinic_id)
  and created_by = auth.uid()
);

drop policy if exists "MessageTemplates: clinic members can update" on public.message_templates;
create policy "MessageTemplates: clinic members can update"
on public.message_templates
for update
using (public.is_member_of_clinic(clinic_id))
with check (public.is_member_of_clinic(clinic_id));

-- outbound_messages RLS
alter table public.outbound_messages enable row level security;

drop policy if exists "OutboundMessages: clinic members can read" on public.outbound_messages;
create policy "OutboundMessages: clinic members can read"
on public.outbound_messages
for select
using (public.is_member_of_clinic(clinic_id));

drop policy if exists "OutboundMessages: clinic members can insert" on public.outbound_messages;
create policy "OutboundMessages: clinic members can insert"
on public.outbound_messages
for insert
with check (
  public.is_member_of_clinic(clinic_id)
  and created_by = auth.uid()
);

drop policy if exists "OutboundMessages: clinic members can update" on public.outbound_messages;
create policy "OutboundMessages: clinic members can update"
on public.outbound_messages
for update
using (public.is_member_of_clinic(clinic_id))
with check (public.is_member_of_clinic(clinic_id));

-- message_delivery_attempts RLS
alter table public.message_delivery_attempts enable row level security;

drop policy if exists "DeliveryAttempts: clinic members can read" on public.message_delivery_attempts;
create policy "DeliveryAttempts: clinic members can read"
on public.message_delivery_attempts
for select
using (public.is_member_of_clinic(clinic_id));

drop policy if exists "DeliveryAttempts: clinic members can insert" on public.message_delivery_attempts;
create policy "DeliveryAttempts: clinic members can insert"
on public.message_delivery_attempts
for insert
with check (public.is_member_of_clinic(clinic_id));

-- staff_notifications RLS
alter table public.staff_notifications enable row level security;

-- User can read only their own notifications, and must be in the clinic
drop policy if exists "Notifications: user can read own" on public.staff_notifications;
create policy "Notifications: user can read own"
on public.staff_notifications
for select
using (
  user_id = auth.uid()
  and public.is_member_of_clinic(clinic_id)
);

-- User can mark their own notifications as read
drop policy if exists "Notifications: user can update own" on public.staff_notifications;
create policy "Notifications: user can update own"
on public.staff_notifications
for update
using (
  user_id = auth.uid()
  and public.is_member_of_clinic(clinic_id)
)
with check (
  user_id = auth.uid()
  and public.is_member_of_clinic(clinic_id)
);

-- END


create extension if not exists "pgcrypto";

-- -------------------------------------------------
-- 1) Invoice counters (per clinic)
-- -------------------------------------------------
create table if not exists public.invoice_counters (
  clinic_id uuid primary key references public.clinics(id) on delete cascade,
  next_number int not null default 1,
  updated_at timestamptz not null default now(),
  constraint invoice_counters_next_number_check check (next_number >= 1)
);

-- updated_at trigger reuse
drop trigger if exists trg_invoice_counters_updated_at on public.invoice_counters;
create trigger trg_invoice_counters_updated_at
before update on public.invoice_counters
for each row
execute function public.set_updated_at();

-- -------------------------------------------------
-- 2) RPC: generate invoice number (atomic)
-- Returns e.g. INV-000001
-- -------------------------------------------------
create or replace function public.generate_invoice_number(_clinic_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
  inv text;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  -- ensure counter row exists
  insert into public.invoice_counters (clinic_id, next_number)
  values (_clinic_id, 1)
  on conflict (clinic_id) do nothing;

  -- lock row and increment
  select next_number into n
  from public.invoice_counters
  where clinic_id = _clinic_id
  for update;

  inv := 'INV-' || lpad(n::text, 6, '0');

  update public.invoice_counters
  set next_number = next_number + 1
  where clinic_id = _clinic_id;

  return inv;
end;
$$;

grant execute on function public.generate_invoice_number(uuid) to authenticated;

-- -------------------------------------------------
-- 3) Invoices
-- -------------------------------------------------
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  appointment_id uuid null references public.appointments(id) on delete set null,
  note_id uuid null references public.clinical_notes(id) on delete set null,

  invoice_number text not null,
  issued_date date not null default current_date,
  due_date date null,

  status text not null default 'draft',
  currency text not null default 'NAD',

  tax_rate numeric(5,2) not null default 0,

  subtotal_cents bigint not null default 0,
  tax_cents bigint not null default 0,
  total_cents bigint not null default 0,

  amount_paid_cents bigint not null default 0,
  balance_due_cents bigint not null default 0,

  -- Claim fields (simple v1)
  claim_status text null,
  claim_reference text null,
  claim_submitted_at timestamptz null,
  claim_paid_at timestamptz null,
  claim_rejection_reason text null,

  -- Snapshot fields (so membership changes don't break old invoices)
  main_member_name_snapshot text null,
  main_member_id_snapshot text null,
  medical_aid_name_snapshot text null,
  medical_aid_plan_snapshot text null,
  medical_aid_number_snapshot text null,
  dependent_code_snapshot text null,

  internal_note text null,
  public_note text null,

  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint invoices_status_check check (status in ('draft','sent','paid','void')),
  constraint invoices_tax_rate_check check (tax_rate >= 0 and tax_rate <= 100),
  constraint invoices_unique_number unique (clinic_id, invoice_number),

  constraint invoices_claim_status_check
    check (claim_status is null or claim_status in ('not_submitted','submitted','paid','rejected'))
);

create index if not exists idx_invoices_clinic_issued_date
on public.invoices (clinic_id, issued_date desc);

create index if not exists idx_invoices_patient_issued_date
on public.invoices (patient_id, issued_date desc);

create index if not exists idx_invoices_status
on public.invoices (status);

drop trigger if exists trg_invoices_updated_at on public.invoices;
create trigger trg_invoices_updated_at
before update on public.invoices
for each row
execute function public.set_updated_at();

-- -------------------------------------------------
-- 4) Invoice items
-- -------------------------------------------------
create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,

  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_price_cents bigint not null default 0,
  line_subtotal_cents bigint not null default 0,

  created_at timestamptz not null default now(),

  constraint invoice_items_quantity_check check (quantity > 0),
  constraint invoice_items_unit_price_check check (unit_price_cents >= 0),
  constraint invoice_items_line_subtotal_check check (line_subtotal_cents >= 0)
);

create index if not exists idx_invoice_items_invoice_id
on public.invoice_items (invoice_id);

-- -------------------------------------------------
-- 5) Payments
-- -------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,

  payment_date date not null default current_date,
  method text not null,
  amount_cents bigint not null,
  reference text null,

  received_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),

  constraint payments_method_check check (method in ('cash','eft','card','medical_aid','other')),
  constraint payments_amount_check check (amount_cents >= 0)
);

create index if not exists idx_payments_invoice_id
on public.payments (invoice_id);

create index if not exists idx_payments_patient_id
on public.payments (patient_id);

create index if not exists idx_payments_payment_date
on public.payments (payment_date desc);

-- -------------------------------------------------
-- 6) RLS
-- -------------------------------------------------

-- invoice_counters RLS (optional; keep locked down)
alter table public.invoice_counters enable row level security;

drop policy if exists "InvoiceCounters: clinic members can read" on public.invoice_counters;
create policy "InvoiceCounters: clinic members can read"
on public.invoice_counters
for select
using (public.is_member_of_clinic(clinic_id));

-- No direct insert/update/delete policies; RPC handles writes.

-- invoices RLS
alter table public.invoices enable row level security;

drop policy if exists "Invoices: clinic members can read" on public.invoices;
create policy "Invoices: clinic members can read"
on public.invoices
for select
using (public.is_member_of_clinic(clinic_id));

drop policy if exists "Invoices: clinic members can insert" on public.invoices;
create policy "Invoices: clinic members can insert"
on public.invoices
for insert
with check (
  public.is_member_of_clinic(clinic_id)
  and created_by = auth.uid()
);

drop policy if exists "Invoices: clinic members can update" on public.invoices;
create policy "Invoices: clinic members can update"
on public.invoices
for update
using (public.is_member_of_clinic(clinic_id))
with check (public.is_member_of_clinic(clinic_id));

-- No delete policy (void instead)

-- invoice_items RLS
alter table public.invoice_items enable row level security;

drop policy if exists "InvoiceItems: clinic members can read" on public.invoice_items;
create policy "InvoiceItems: clinic members can read"
on public.invoice_items
for select
using (public.is_member_of_clinic(clinic_id));

drop policy if exists "InvoiceItems: clinic members can insert" on public.invoice_items;
create policy "InvoiceItems: clinic members can insert"
on public.invoice_items
for insert
with check (public.is_member_of_clinic(clinic_id));

drop policy if exists "InvoiceItems: clinic members can update" on public.invoice_items;
create policy "InvoiceItems: clinic members can update"
on public.invoice_items
for update
using (public.is_member_of_clinic(clinic_id))
with check (public.is_member_of_clinic(clinic_id));

drop policy if exists "InvoiceItems: clinic members can delete" on public.invoice_items;
create policy "InvoiceItems: clinic members can delete"
on public.invoice_items
for delete
using (public.is_member_of_clinic(clinic_id));

-- payments RLS
alter table public.payments enable row level security;

drop policy if exists "Payments: clinic members can read" on public.payments;
create policy "Payments: clinic members can read"
on public.payments
for select
using (public.is_member_of_clinic(clinic_id));

drop policy if exists "Payments: clinic members can insert" on public.payments;
create policy "Payments: clinic members can insert"
on public.payments
for insert
with check (
  public.is_member_of_clinic(clinic_id)
  and received_by = auth.uid()
);

-- Usually you don't want payment edits; but allow update if you need corrections.
drop policy if exists "Payments: clinic members can update" on public.payments;
create policy "Payments: clinic members can update"
on public.payments
for update
using (public.is_member_of_clinic(clinic_id))
with check (public.is_member_of_clinic(clinic_id));

-- No delete policy by default (audit trail)

-- END


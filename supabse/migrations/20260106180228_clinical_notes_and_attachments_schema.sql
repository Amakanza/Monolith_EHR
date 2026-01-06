create extension if not exists "pgcrypto";

-- -------------------------------------------------
-- 1) Note templates (per clinic)
-- -------------------------------------------------
create table if not exists public.note_templates (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null,
  template_json jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_note_templates_clinic_id on public.note_templates (clinic_id);
create index if not exists idx_note_templates_is_active on public.note_templates (is_active);

do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'uq_note_templates_clinic_name'
  ) then
    execute 'create unique index uq_note_templates_clinic_name
             on public.note_templates (clinic_id, lower(name))';
  end if;
end $$;

drop trigger if exists trg_note_templates_updated_at on public.note_templates;
create trigger trg_note_templates_updated_at
before update on public.note_templates
for each row
execute function public.set_updated_at();


-- -------------------------------------------------
-- 2) Clinical notes (SOAP)
-- -------------------------------------------------
create table if not exists public.clinical_notes (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  appointment_id uuid null references public.appointments(id) on delete set null,
  template_id uuid null references public.note_templates(id) on delete set null,

  title text not null default 'Clinical Note',
  note_date date not null default current_date,

  subjective text null,
  objective text null,
  assessment text null,
  plan text null,

  additional_text text null,
  tags text[] null,

  status text not null default 'draft',
  finalized_at timestamptz null,
  finalized_by uuid null references public.user_profiles(id) on delete set null,

  author_id uuid not null references public.user_profiles(id) on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint clinical_notes_status_check
    check (status in ('draft','final'))
);

create index if not exists idx_clinical_notes_clinic_patient_date
on public.clinical_notes (clinic_id, patient_id, note_date desc);

create index if not exists idx_clinical_notes_appointment_id
on public.clinical_notes (appointment_id);

create index if not exists idx_clinical_notes_status
on public.clinical_notes (status);

drop trigger if exists trg_clinical_notes_updated_at on public.clinical_notes;
create trigger trg_clinical_notes_updated_at
before update on public.clinical_notes
for each row
execute function public.set_updated_at();


-- -------------------------------------------------
-- 3) Note attachments (metadata pointing to Storage)
-- -------------------------------------------------
create table if not exists public.note_attachments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  note_id uuid not null references public.clinical_notes(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,

  bucket text not null default 'note-attachments',
  object_path text not null,
  file_name text not null,
  content_type text null,
  file_size_bytes bigint null,

  uploaded_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),

  constraint note_attachments_unique_object_per_note unique (note_id, object_path)
);

create index if not exists idx_note_attachments_note_id on public.note_attachments (note_id);
create index if not exists idx_note_attachments_patient_id on public.note_attachments (patient_id);


-- -------------------------------------------------
-- 4) RLS
-- -------------------------------------------------

-- note_templates RLS
alter table public.note_templates enable row level security;

drop policy if exists "NoteTemplates: clinic members can read" on public.note_templates;
create policy "NoteTemplates: clinic members can read"
on public.note_templates
for select
using (public.is_member_of_clinic(clinic_id));

drop policy if exists "NoteTemplates: clinic members can insert" on public.note_templates;
create policy "NoteTemplates: clinic members can insert"
on public.note_templates
for insert
with check (
  public.is_member_of_clinic(clinic_id)
  and created_by = auth.uid()
);

drop policy if exists "NoteTemplates: clinic members can update" on public.note_templates;
create policy "NoteTemplates: clinic members can update"
on public.note_templates
for update
using (public.is_member_of_clinic(clinic_id))
with check (public.is_member_of_clinic(clinic_id));

-- No delete policy (deactivate via is_active)


-- clinical_notes RLS
alter table public.clinical_notes enable row level security;

drop policy if exists "ClinicalNotes: clinic members can read" on public.clinical_notes;
create policy "ClinicalNotes: clinic members can read"
on public.clinical_notes
for select
using (public.is_member_of_clinic(clinic_id));

drop policy if exists "ClinicalNotes: clinic members can insert" on public.clinical_notes;
create policy "ClinicalNotes: clinic members can insert"
on public.clinical_notes
for insert
with check (
  public.is_member_of_clinic(clinic_id)
  and author_id = auth.uid()
);

drop policy if exists "ClinicalNotes: clinic members can update" on public.clinical_notes;
create policy "ClinicalNotes: clinic members can update"
on public.clinical_notes
for update
using (public.is_member_of_clinic(clinic_id))
with check (public.is_member_of_clinic(clinic_id));

-- No delete policy


-- note_attachments RLS
alter table public.note_attachments enable row level security;

drop policy if exists "NoteAttachments: clinic members can read" on public.note_attachments;
create policy "NoteAttachments: clinic members can read"
on public.note_attachments
for select
using (public.is_member_of_clinic(clinic_id));

drop policy if exists "NoteAttachments: clinic members can insert" on public.note_attachments;
create policy "NoteAttachments: clinic members can insert"
on public.note_attachments
for insert
with check (
  public.is_member_of_clinic(clinic_id)
  and uploaded_by = auth.uid()
);

drop policy if exists "NoteAttachments: clinic members can delete" on public.note_attachments;
create policy "NoteAttachments: clinic members can delete"
on public.note_attachments
for delete
using (public.is_member_of_clinic(clinic_id));

-- Updates are usually unnecessary for attachments metadata; omit update policy.

-- END


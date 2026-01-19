
import { createClient } from '@/lib/server/supabase/server';
import { ensureAuthenticatedServer } from '@/lib/services/authService';
import {
  ClinicalNote,
  ClinicalNoteWithAttachments,
  CreateAttachmentMetadataInput,
  CreateClinicalNoteInput,
  CreateTemplateInput,
  NoteAttachment,
  NoteTemplate,
  UpdateClinicalNoteInput,
  UpdateTemplateInput
} from '@/lib/types/notes';
import { recordAuditEvent } from '@/lib/services/reportingService';
import { dbToAppProfile } from '@/lib/mappers/userProfile';

// --- Mappers ---

function mapNote(row: any): ClinicalNote {
  // Use centralized mapper for user profile fields
  const authorAppProfile = row.author_profile ? dbToAppProfile(row.author_profile) : null;
  const finalizerAppProfile = row.finalizer_profile ? dbToAppProfile(row.finalizer_profile) : null;

  return {
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    appointmentId: row.appointment_id,
    templateId: row.template_id,
    title: row.title,
    noteDate: row.note_date,
    subjective: row.subjective,
    objective: row.objective,
    assessment: row.assessment,
    plan: row.plan,
    additionalText: row.additional_text,
    tags: row.tags,
    status: row.status,
    finalizedAt: row.finalized_at,
    finalizedBy: row.finalized_by,
    authorId: row.author_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    authorName: authorAppProfile?.fullName || undefined,
    finalizerName: finalizerAppProfile?.fullName || undefined,
    templateName: row.note_templates?.name
  };
}

function mapTemplate(row: any): NoteTemplate {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    name: row.name,
    templateJson: row.template_json,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapAttachment(row: any): NoteAttachment {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    noteId: row.note_id,
    patientId: row.patient_id,
    bucket: row.bucket,
    objectPath: row.object_path,
    fileName: row.file_name,
    contentType: row.content_type,
    fileSizeBytes: row.file_size_bytes,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at
  };
}

// --- Templates ---

export async function createNoteTemplate(input: CreateTemplateInput & { clinicId?: string }): Promise<{ template: NoteTemplate }> {
  const user = await ensureAuthenticatedServer();
  const supabase = await createClient();
  const clinicId = input.clinicId || user.activeClinicId;
  if (!clinicId) throw new Error('ACTIVE_CLINIC_REQUIRED');

  const { data, error } = await supabase
    .from('note_templates')
    .insert({
      clinic_id: clinicId,
      name: input.name,
      template_json: input.templateJson || {},
      created_by: user.id
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { template: mapTemplate(data) };
}

export async function listNoteTemplates(input: { clinicId?: string; includeInactive?: boolean } = {}): Promise<{ templates: NoteTemplate[] }> {
  const user = await ensureAuthenticatedServer();
  const supabase = await createClient();
  const clinicId = input.clinicId || user.activeClinicId;
  if (!clinicId) throw new Error('ACTIVE_CLINIC_REQUIRED');

  let query = supabase
    .from('note_templates')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('name');

  if (!input.includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return { templates: data.map(mapTemplate) };
}

export async function updateNoteTemplate(templateId: string, input: UpdateTemplateInput): Promise<{ template: NoteTemplate }> {
  const supabase = await createClient();
  
  const updates: any = { updated_at: new Date().toISOString() };
  if (input.name) updates.name = input.name;
  if (input.templateJson) updates.template_json = input.templateJson;
  if (input.isActive !== undefined) updates.is_active = input.isActive;

  const { data, error } = await supabase
    .from('note_templates')
    .update(updates)
    .eq('id', templateId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { template: mapTemplate(data) };
}

// --- Clinical Notes ---

export async function createClinicalNote(input: CreateClinicalNoteInput & { clinicId?: string }): Promise<{ note: ClinicalNote }> {
  const user = await ensureAuthenticatedServer();
  const supabase = await createClient();
  const clinicId = input.clinicId || user.activeClinicId;
  if (!clinicId) throw new Error('ACTIVE_CLINIC_REQUIRED');

  const { data, error } = await supabase
    .from('clinical_notes')
    .insert({
      clinic_id: clinicId,
      patient_id: input.patientId,
      appointment_id: input.appointmentId,
      template_id: input.templateId,
      title: input.title,
      note_date: input.noteDate,
      subjective: input.subjective,
      objective: input.objective,
      assessment: input.assessment,
      plan: input.plan,
      additional_text: input.additionalText,
      tags: input.tags,
      author_id: user.id,
      status: 'draft'
})
    .select('*, author_profile:user_profiles!author_id(*), note_templates(name)')
    .single();

  if (error) throw new Error(error.message);

  await recordAuditEvent({
    clinicId,
    eventType: 'note.created',
    entityType: 'clinical_note',
    entityId: data.id,
    metadata: { patientId: input.patientId, title: input.title }
  });

  return { note: mapNote(data) };
}

export async function updateClinicalNote(noteId: string, input: UpdateClinicalNoteInput): Promise<{ note: ClinicalNote }> {
  const supabase = await createClient();

  const { data: current, error: fetchError } = await supabase
    .from('clinical_notes')
    .select('status')
    .eq('id', noteId)
    .single();

  if (fetchError || !current) throw new Error('NOTE_NOT_FOUND');
  if (current.status === 'final') throw new Error('NOTE_FINALIZED: Cannot edit a finalized note.');

  const updates: any = { updated_at: new Date().toISOString() };
  if (input.title) updates.title = input.title;
  if (input.noteDate) updates.note_date = input.noteDate;
  if (input.subjective !== undefined) updates.subjective = input.subjective;
  if (input.objective !== undefined) updates.objective = input.objective;
  if (input.assessment !== undefined) updates.assessment = input.assessment;
  if (input.plan !== undefined) updates.plan = input.plan;
  if (input.additionalText !== undefined) updates.additional_text = input.additionalText;
  if (input.tags !== undefined) updates.tags = input.tags;

  const { data, error } = await supabase
    .from('clinical_notes')
    .update(updates)
    .eq('id', noteId)
.select('*, author_profile:user_profiles!author_id(*), note_templates(name)')
    .single();

  if (error) throw new Error(error.message);
  return { note: mapNote(data) };
}

export async function finalizeClinicalNote(noteId: string): Promise<{ note: ClinicalNote }> {
  const user = await ensureAuthenticatedServer();
  const supabase = await createClient();

  const { data: current, error: fetchError } = await supabase
    .from('clinical_notes')
    .select('status, clinic_id')
    .eq('id', noteId)
    .single();

  if (fetchError) throw new Error('NOTE_NOT_FOUND');
  if (current.status === 'final') throw new Error('NOTE_FINALIZED: Note is already finalized.');

  const { data, error } = await supabase
    .from('clinical_notes')
    .update({
      status: 'final',
      finalized_at: new Date().toISOString(),
      finalized_by: user.id
    })
    .eq('id', noteId)
.select('*, author_profile:user_profiles!author_id(*), finalizer_profile:user_profiles!finalized_by(*), note_templates(name)')
    .single();

  if (error) throw new Error(error.message);

  await recordAuditEvent({
    clinicId: current.clinic_id,
    eventType: 'note.finalized',
    entityType: 'clinical_note',
    entityId: noteId
  });

  return { note: mapNote(data) };
}

export async function getClinicalNoteById(noteId: string): Promise<ClinicalNoteWithAttachments> {
  const supabase = await createClient();

  const { data: noteData, error: noteError } = await supabase
    .from('clinical_notes')
    .select(`
*,
      author_profile:user_profiles!author_id(*),
      finalizer_profile:user_profiles!finalized_by(*),
      note_templates(name)
    `)
    .eq('id', noteId)
    .single();

  if (noteError || !noteData) throw new Error('NOTE_NOT_FOUND');

  const { data: attachmentsData, error: attError } = await supabase
    .from('note_attachments')
    .select('*')
    .eq('note_id', noteId)
    .order('created_at', { ascending: false });

  if (attError) throw new Error(attError.message);

  return {
    note: mapNote(noteData),
    attachments: attachmentsData.map(mapAttachment)
  };
}

export async function listNotesForPatient(input: { patientId: string; includeDrafts?: boolean; limit?: number; offset?: number }): Promise<{ notes: ClinicalNote[] }> {
  const user = await ensureAuthenticatedServer();
  const supabase = await createClient();

  let query = supabase
    .from('clinical_notes')
    .select('*, author_profile:user_profiles!author_id(*), note_templates(name)')
    .eq('clinic_id', user.activeClinicId)
    .eq('patient_id', input.patientId)
    .order('note_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (input.includeDrafts === false) {
    query = query.eq('status', 'final');
  }

  if (input.limit) query = query.limit(input.limit);
  if (input.offset) query = query.range(input.offset, input.offset + (input.limit || 10) - 1);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return { notes: data.map(mapNote) };
}

// --- Attachments ---

export async function createAttachmentUploadUrl(input: { noteId: string; fileName: string; contentType: string }): Promise<{ uploadUrl: string; objectPath: string }> {
  const user = await ensureAuthenticatedServer();
  const supabase = await createClient();

  const { data: note } = await supabase.from('clinical_notes').select('clinic_id, patient_id').eq('id', input.noteId).single();
  if (!note) throw new Error('NOTE_NOT_FOUND');
  if (note.clinic_id !== user.activeClinicId) throw new Error('CLINIC_MISMATCH');

  const uniqueName = `${Date.now()}_${input.fileName.replace(/\s+/g, '_')}`;
  const objectPath = `${note.clinic_id}/${note.patient_id}/${input.noteId}/${uniqueName}`;

  const { data, error } = await supabase
    .storage
    .from('note-attachments')
    .createSignedUploadUrl(objectPath);

  if (error) throw new Error(error.message);

  return {
    uploadUrl: data.signedUrl,
    objectPath: data.path
  };
}

export async function recordAttachmentMetadata(input: CreateAttachmentMetadataInput): Promise<{ attachment: NoteAttachment }> {
  const user = await ensureAuthenticatedServer();
  const supabase = await createClient();

  const { data: note } = await supabase.from('clinical_notes').select('clinic_id, patient_id').eq('id', input.noteId).single();
  if (!note) throw new Error('NOTE_NOT_FOUND');

  const { data, error } = await supabase
    .from('note_attachments')
    .insert({
      clinic_id: note.clinic_id,
      patient_id: note.patient_id,
      note_id: input.noteId,
      bucket: 'note-attachments',
      object_path: input.objectPath,
      file_name: input.fileName,
      content_type: input.contentType,
      file_size_bytes: input.fileSizeBytes,
      uploaded_by: user.id
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { attachment: mapAttachment(data) };
}

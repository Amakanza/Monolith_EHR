import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { getActiveClinic } from '@/lib/server/clinic/get-active-clinic';
import { z } from 'zod';

export const noteSchema = z.object({
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional().nullable(),
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
});

export const updateNoteSchema = noteSchema.omit({ patientId: true, appointmentId: true }).partial();

export type CreateNoteInput = z.infer<typeof noteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;

export async function listNotesForPatient(patientId: string) {
  const { clinicId } = await getActiveClinic();
  const supabase = createClient();

  const { data, error } = await supabase
    .from('clinical_notes')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getNoteById(noteId: string) {
  const { clinicId } = await getActiveClinic();
  const supabase = createClient();

  const { data, error } = await supabase
    .from('clinical_notes')
    .select('*, patients(first_name, last_name)')
    .eq('id', noteId)
    .eq('clinic_id', clinicId)
    .single();

  if (error) throw error;
  return data;
}

export async function createNote(input: CreateNoteInput) {
  const { clinicId } = await getActiveClinic();
  const supabase = createClient();

  const parsed = noteSchema.parse(input);

  const { data, error } = await supabase
    .from('clinical_notes')
    .insert({
      clinic_id: clinicId,
      patient_id: parsed.patientId,
      appointment_id: parsed.appointmentId || null,
      subjective: parsed.subjective || '',
      objective: parsed.objective || '',
      assessment: parsed.assessment || '',
      plan: parsed.plan || '',
      status: 'draft',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateNote(noteId: string, input: UpdateNoteInput) {
  const { clinicId } = await getActiveClinic();
  const supabase = createClient();

  // Check current status
  const { data: current, error: fetchError } = await supabase
    .from('clinical_notes')
    .select('status')
    .eq('id', noteId)
    .eq('clinic_id', clinicId)
    .single();

  if (fetchError) throw fetchError;
  if (current.status === 'final') {
    throw new Error('Cannot update a finalized note.');
  }

  const parsed = updateNoteSchema.parse(input);

  const { data, error } = await supabase
    .from('clinical_notes')
    .update({
      ...parsed,
      updated_at: new Date().toISOString(),
    })
    .eq('id', noteId)
    .eq('clinic_id', clinicId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function finalizeNote(noteId: string) {
  const { clinicId } = await getActiveClinic();
  const supabase = createClient();

  // Check current status
  const { data: current, error: fetchError } = await supabase
    .from('clinical_notes')
    .select('status')
    .eq('id', noteId)
    .eq('clinic_id', clinicId)
    .single();

  if (fetchError) throw fetchError;
  if (current.status === 'final') {
    throw new Error('Note is already finalized.');
  }

  const { data, error } = await supabase
    .from('clinical_notes')
    .update({
      status: 'final',
      finalized_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', noteId)
    .eq('clinic_id', clinicId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

import 'server-only';
import { createClient } from '@/lib/server/supabase/server';
import { getActiveClinic } from '@/lib/server/clinic/get-active-clinic';
import { z } from 'zod';

export const createPatientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  dob: z.string().optional().or(z.literal('')),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;

export async function listPatients() {
  const { clinicId } = await getActiveClinic();
  const supabase = createClient();

  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('clinic_id', clinicId)
    .is('archived_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createPatient(input: CreatePatientInput) {
  const { clinicId } = await getActiveClinic();
  const supabase = createClient();

  const parsed = createPatientSchema.parse(input);

  const { data, error } = await supabase
    .from('patients')
    .insert({
      clinic_id: clinicId,
      first_name: parsed.firstName,
      last_name: parsed.lastName,
      email: parsed.email || null,
      phone: parsed.phone || null,
      dob: parsed.dob || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPatientById(id: string) {
  const { clinicId } = await getActiveClinic();
  const supabase = createClient();

  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .eq('clinic_id', clinicId)
    .single();

  if (error) throw error;
  return data;
}

export async function archivePatient(id: string) {
  const { clinicId } = await getActiveClinic();
  const supabase = createClient();

  const { error } = await supabase
    .from('patients')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)
    .eq('clinic_id', clinicId);

  if (error) throw error;
}

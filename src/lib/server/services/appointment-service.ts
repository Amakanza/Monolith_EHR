
import 'server-only';
import { createClient } from '@/lib/server/supabase/server';

export type CreateAppointmentDTO = {
  patientId: string;
  startTime: string; // ISO
  endTime: string; // ISO
  notes?: string;
};

export async function getAppointments(clinicId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      patients (first_name, last_name)
    `)
    .eq('clinic_id', clinicId)
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data;
}

export async function createAppointment(clinicId: string, data: CreateAppointmentDTO) {
  const supabase = createClient();
  
  // Note: Double booking prevention should be a Postgres Exclusion Constraint.
  // We just handle the insert error here.
  const { error } = await supabase.from('appointments').insert({
    clinic_id: clinicId,
    patient_id: data.patientId,
    start_time: data.startTime,
    end_time: data.endTime,
    notes: data.notes || null,
  });

  if (error) {
    if (error.code === '23P01') { // Exclusion violation code
      throw new Error('Double booking detected. This slot is already taken.');
    }
    throw error;
  }
}

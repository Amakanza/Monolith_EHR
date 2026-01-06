import 'server-only';
import { createClient } from '@/lib/server/supabase/server';
import { getActiveClinic } from '@/lib/server/clinic/get-active-clinic';
import { z } from 'zod';

export const createAppointmentSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
  appointmentTypeId: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  notes: z.string().optional(),
}).refine(data => new Date(data.endTime) > new Date(data.startTime), {
  message: "End time must be after start time",
  path: ["endTime"],
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export async function listAppointments(range?: { from: Date; to: Date }) {
  const { clinicId } = await getActiveClinic();
  const supabase = createClient();
  
  // Default to next 7 days if not provided
  const from = range?.from?.toISOString() ?? new Date().toISOString();
  const to = range?.to?.toISOString() ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      patients (first_name, last_name)
    `)
    .eq('clinic_id', clinicId)
    .gte('start_time', from)
    .lte('start_time', to)
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data;
}

export async function createAppointment(input: CreateAppointmentInput) {
  const { clinicId } = await getActiveClinic();
  const supabase = createClient();

  const parsed = createAppointmentSchema.parse(input);

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      clinic_id: clinicId,
      patient_id: parsed.patientId,
      start_time: parsed.startTime,
      end_time: parsed.endTime,
      notes: parsed.notes || null,
      status: 'booked', // Default status
      // We are not inserting appointment_type_id yet as the schema might not have it,
      // but we accept it in input for future compatibility.
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23P01') {
      throw new Error('Time slot already booked.');
    }
    throw error;
  }

  return data;
}

export async function listAppointmentTypes() {
  // Static list for now, as we don't have a guaranteed table for types yet.
  return [
    { id: 'general', name: 'General Consultation (30 min)', duration: 30 },
    { id: 'followup', name: 'Follow-up (15 min)', duration: 15 },
    { id: 'initial', name: 'Initial Assessment (60 min)', duration: 60 },
    { id: 'therapy', name: 'Therapy Session (45 min)', duration: 45 },
  ];
}

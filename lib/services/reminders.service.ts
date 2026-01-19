
import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { getActiveClinic } from '@/lib/server/clinic/get-active-clinic';
import { logEvent } from './audit.service';

export async function generateAppointmentReminders() {
  const { clinicId, user } = await getActiveClinic();
  const supabase = await createClient();

  const now = new Date();
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // 1. Find appointments in next 24h
  const { data: appointments, error: apptError } = await supabase
    .from('appointments')
    .select(`
      id, 
      start_time, 
      patient_id, 
      patients (first_name, last_name, phone, email)
    `)
    .eq('clinic_id', clinicId)
    .gte('start_time', now.toISOString())
    .lte('start_time', next24h.toISOString())
    .neq('status', 'cancelled'); // Don't remind cancelled

  if (apptError) throw apptError;
  if (!appointments || appointments.length === 0) return { created: 0 };

  let createdCount = 0;

  for (const appt of appointments) {
    const patient = appt.patients as any;
    if (!patient) continue;

    // Check if reminder already sent for this appointment
    const { data: existing } = await supabase
      .from('outbound_messages')
      .select('id')
      .eq('appointment_id', appt.id)
      .eq('subject', 'Appointment Reminder') // Simple check
      .single();

    if (existing) continue;

    // Determine channel
    let channel = 'sms';
    let contact = patient.phone;
    if (!contact && patient.email) {
      channel = 'email';
      contact = patient.email;
    }

    if (!contact) continue; // No contact info

    const timeString = new Date(appt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const body = `Reminder: You have an appointment tomorrow at ${timeString}.`;

    await supabase.from('outbound_messages').insert({
      clinic_id: clinicId,
      created_by: user.id,
      patient_id: appt.patient_id,
      appointment_id: appt.id,
      recipient_name: `${patient.first_name} ${patient.last_name}`,
      recipient_contact: contact,
      channel: channel,
      subject: 'Appointment Reminder',
      body: body,
      status: 'queued'
    });

    createdCount++;
  }

  if (createdCount > 0) {
    await logEvent({
      action: 'generate',
      entityType: 'reminders',
      metadata: { count: createdCount }
    });
  }

  return { created: createdCount };
}
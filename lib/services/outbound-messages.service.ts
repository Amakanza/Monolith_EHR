
import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { getActiveClinic } from '@/lib/server/clinic/get-active-clinic';
import { z } from 'zod';
import { logEvent } from './audit.service';

export const createMessageSchema = z.object({
  patientId: z.string().uuid(),
  channel: z.enum(['sms', 'email', 'whatsapp']),
  subject: z.string().optional(),
  body: z.string().min(1),
  templateId: z.string().optional(),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;

export async function listOutboundMessages() {
  const { clinicId } = await getActiveClinic();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('outbound_messages')
    .select('*, patients(first_name, last_name)')
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false })
    .limit(50); // Cap at 50 for MVP

  if (error) throw error;
  return data;
}

export async function createOutboundMessage(input: CreateMessageInput) {
  const { clinicId, user } = await getActiveClinic();
  const supabase = await createClient();

  const parsed = createMessageSchema.parse(input);

  // Fetch patient details for recipient info
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('first_name, last_name, phone, email')
    .eq('id', parsed.patientId)
    .single();

  if (patientError || !patient) throw new Error("Patient not found");

  const recipientContact = parsed.channel === 'email' ? patient.email : patient.phone;
  if (!recipientContact) throw new Error(`Patient has no contact info for ${parsed.channel}`);

  const { data, error } = await supabase
    .from('outbound_messages')
    .insert({
      clinic_id: clinicId,
      created_by: user.id,
      patient_id: parsed.patientId,
      channel: parsed.channel,
      recipient_name: `${patient.first_name} ${patient.last_name}`,
      recipient_contact: recipientContact,
      subject: parsed.subject || null,
      body: parsed.body,
      status: 'queued', // Default status
    })
    .select()
    .single();

  if (error) throw error;

  await logEvent({
    action: 'create',
    entityType: 'outbound_message',
    entityId: data.id,
    metadata: { channel: parsed.channel }
  });

  return data;
}
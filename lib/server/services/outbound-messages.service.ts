import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { ensureAuthenticatedServer } from '@/lib/services/authService';
import { logEvent } from './audit.service';

export const createMessageSchema = {
  patientId: 'string',
  channel: ['sms', 'email', 'whatsapp'],
  subject: 'string',
  body: 'string',
  templateId: 'string',
};

export type CreateMessageInput = typeof createMessageSchema;

export async function listOutboundMessages() {
  const user = await ensureAuthenticatedServer();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('outbound_messages')
    .select('*, patients(first_name, last_name)')
    .eq('clinic_id', user.activeClinicId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data;
}

export async function createOutboundMessage(input: CreateMessageInput) {
  const user = await ensureAuthenticatedServer();
  const supabase = await createClient();

  // Fetch patient details for recipient info
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('first_name, last_name, phone, email')
    .eq('id', input.patientId)
    .single();

  if (patientError || !patient) throw new Error("Patient not found");

  const recipientContact = input.channel === 'email' ? patient.email : patient.phone;
  if (!recipientContact) throw new Error(`Patient has no contact info for ${input.channel}`);

  const { data, error } = await supabase
    .from('outbound_messages')
    .insert({
      clinic_id: user.activeClinicId,
      created_by: user.id,
      patient_id: input.patientId,
      channel: input.channel,
      recipient_name: `${patient.first_name} ${patient.last_name}`,
      recipient_contact: recipientContact,
      subject: input.subject || null,
      body: input.body,
      status: 'queued',
    })
    .select()
    .single();

  if (error) throw error;

  await logEvent({
    action: 'create',
    entityType: 'outbound_message',
    entityId: data.id,
    metadata: { channel: input.channel }
  });

  return data;
}
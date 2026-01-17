
import { createClient } from '@/lib/server/supabase/server';
import { ensureAuthenticatedServer } from '@/lib/services/authService';
import {
  CreateNotificationInput,
  CreateTemplateInput,
  DeliveryAttempt,
  ListMessagesQuery,
  MessageTemplate,
  OutboundMessage,
  QueueMessageInput,
  StaffNotification,
  UpdateTemplateInput
} from '@/lib/types/communications';
import { recordAuditEvent } from '@/lib/services/reportingService';

// --- Mappers ---

function mapTemplate(row: any): MessageTemplate {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    name: row.name,
    channel: row.channel,
    subject: row.subject,
    body: row.body,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapMessage(row: any): OutboundMessage {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    appointmentId: row.appointment_id,
    invoiceId: row.invoice_id,
    recipientName: row.recipient_name,
    recipientContact: row.recipient_contact,
    channel: row.channel,
    subject: row.subject,
    body: row.body,
    plannedSendAt: row.planned_send_at,
    sendAfterEvent: row.send_after_event,
    status: row.status,
    sentAt: row.sent_at,
    failedAt: row.failed_at,
    failureReason: row.failure_reason,
    cancelledAt: row.cancelled_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    patientName: row.patients ? `${row.patients.first_name} ${row.patients.last_name}` : undefined,
    creatorName: row.user_profiles ? row.user_profiles.full_name : undefined
  };
}

function mapNotification(row: any): StaffNotification {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    userId: row.user_id,
    title: row.title,
    body: row.body,
    linkUrl: row.link_url,
    status: row.status,
    createdAt: row.created_at,
    readAt: row.read_at
  };
}

function mapAttempt(row: any): DeliveryAttempt {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    messageId: row.message_id,
    attemptNumber: row.attempt_number,
    attemptedAt: row.attempted_at,
    provider: row.provider,
    providerMessageId: row.provider_message_id,
    status: row.status,
    error: row.error
  };
}

// --- Templates ---

export async function createMessageTemplate(input: CreateTemplateInput & { clinicId?: string }): Promise<{ template: MessageTemplate }> {
  const user = await ensureAuthenticatedServer();
  const supabase = await createClient();
  const clinicId = input.clinicId || user.activeClinicId;
  if (!clinicId) throw new Error('ACTIVE_CLINIC_REQUIRED');

  const { data, error } = await supabase
    .from('message_templates')
    .insert({
      clinic_id: clinicId,
      name: input.name,
      channel: input.channel,
      subject: input.subject,
      body: input.body,
      created_by: user.id
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { template: mapTemplate(data) };
}

export async function listMessageTemplates(clinicId?: string): Promise<{ templates: MessageTemplate[] }> {
  const user = await ensureAuthenticatedServer();
  const supabase = await createClient();
  const cid = clinicId || user.activeClinicId;
  if (!cid) throw new Error('ACTIVE_CLINIC_REQUIRED');

  const { data, error } = await supabase
    .from('message_templates')
    .select('*')
    .eq('clinic_id', cid)
    .order('name');

  if (error) throw new Error(error.message);
  return { templates: data.map(mapTemplate) };
}

export async function updateMessageTemplate(id: string, input: UpdateTemplateInput): Promise<{ template: MessageTemplate }> {
  const supabase = await createClient();
  
  const updates: any = {};
  if (input.name) updates.name = input.name;
  if (input.channel) updates.channel = input.channel;
  if (input.subject !== undefined) updates.subject = input.subject;
  if (input.body) updates.body = input.body;
  if (input.isActive !== undefined) updates.is_active = input.isActive;

  const { data, error } = await supabase
    .from('message_templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { template: mapTemplate(data) };
}

// --- Messages ---

export async function queueMessage(input: QueueMessageInput & { clinicId?: string }): Promise<{ message: OutboundMessage }> {
  const user = await ensureAuthenticatedServer();
  const supabase = await createClient();
  const clinicId = input.clinicId || user.activeClinicId;
  if (!clinicId) throw new Error('ACTIVE_CLINIC_REQUIRED');

  const { data, error } = await supabase
    .from('outbound_messages')
    .insert({
      clinic_id: clinicId,
      patient_id: input.patientId,
      appointment_id: input.appointmentId,
      invoice_id: input.invoiceId,
      recipient_name: input.recipientName,
      recipient_contact: input.recipientContact,
      channel: input.channel,
      subject: input.subject,
      body: input.body,
      planned_send_at: input.plannedSendAt,
      created_by: user.id,
      status: 'queued'
    })
    .select('*, patients(first_name, last_name), user_profiles(full_name)')
    .single();

  if (error) throw new Error(error.message);

  await recordAuditEvent({
    clinicId,
    eventType: 'message.queued',
    entityType: 'outbound_message',
    entityId: data.id,
    metadata: { channel: input.channel, recipient: input.recipientName }
  });

  return { message: mapMessage(data) };
}

export async function listMessages(query: ListMessagesQuery): Promise<{ messages: OutboundMessage[] }> {
  const user = await ensureAuthenticatedServer();
  const supabase = await createClient();
  const clinicId = query.clinicId || user.activeClinicId;
  if (!clinicId) throw new Error('ACTIVE_CLINIC_REQUIRED');

  let dbQuery = supabase
    .from('outbound_messages')
    .select('*, patients(first_name, last_name), user_profiles(full_name)')
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false });

  if (query.patientId) dbQuery = dbQuery.eq('patient_id', query.patientId);
  if (query.status) dbQuery = dbQuery.eq('status', query.status);
  if (query.from) dbQuery = dbQuery.gte('planned_send_at', query.from);
  if (query.to) dbQuery = dbQuery.lte('planned_send_at', query.to);
  
  if (query.limit) dbQuery = dbQuery.limit(query.limit);
  if (query.offset) dbQuery = dbQuery.range(query.offset, query.offset + (query.limit || 20) - 1);

  const { data, error } = await dbQuery;
  if (error) throw new Error(error.message);

  return { messages: data.map(mapMessage) };
}

export async function cancelMessage(messageId: string): Promise<{ message: OutboundMessage }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('outbound_messages')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', messageId)
    .select('*, patients(first_name, last_name), user_profiles(full_name)')
    .single();

  if (error) throw new Error(error.message);
  return { message: mapMessage(data) };
}

export async function markMessageSent(messageId: string): Promise<{ message: OutboundMessage }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('outbound_messages')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', messageId)
    .select('*, patients(first_name, last_name), user_profiles(full_name)')
    .single();

  if (error) throw new Error(error.message);

  await recordAuditEvent({
    clinicId: data.clinic_id,
    eventType: 'message.sent',
    entityType: 'outbound_message',
    entityId: data.id
  });

  return { message: mapMessage(data) };
}

export async function markMessageFailed(messageId: string, reason?: string): Promise<{ message: OutboundMessage }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('outbound_messages')
    .update({ status: 'failed', failed_at: new Date().toISOString(), failure_reason: reason })
    .eq('id', messageId)
    .select('*, patients(first_name, last_name), user_profiles(full_name)')
    .single();

  if (error) throw new Error(error.message);

  await recordAuditEvent({
    clinicId: data.clinic_id,
    eventType: 'message.failed',
    entityType: 'outbound_message',
    entityId: data.id,
    metadata: { reason }
  });

  return { message: mapMessage(data) };
}

export async function createDeliveryAttempt(input: { messageId: string; status: 'sent' | 'failed'; provider?: string; providerMessageId?: string; error?: string }): Promise<{ attempt: DeliveryAttempt }> {
  const supabase = await createClient();
  const { data: msg } = await supabase.from('outbound_messages').select('clinic_id, id').eq('id', input.messageId).single();
  if (!msg) throw new Error('MESSAGE_NOT_FOUND');

  const { data, error } = await supabase
    .from('message_delivery_attempts')
    .insert({
      clinic_id: msg.clinic_id,
      message_id: input.messageId,
      status: input.status,
      provider: input.provider,
      provider_message_id: input.providerMessageId,
      error: input.error
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { attempt: mapAttempt(data) };
}

// --- Notifications ---

export async function createNotification(input: CreateNotificationInput & { clinicId?: string }): Promise<{ notification: StaffNotification }> {
  const user = await ensureAuthenticatedServer();
  const supabase = await createClient();
  const clinicId = input.clinicId || user.activeClinicId;
  if (!clinicId) throw new Error('ACTIVE_CLINIC_REQUIRED');

  const { data, error } = await supabase
    .from('staff_notifications')
    .insert({
      clinic_id: clinicId,
      user_id: input.userId,
      title: input.title,
      body: input.body,
      link_url: input.linkUrl
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { notification: mapNotification(data) };
}

export async function listMyNotifications(limit = 20): Promise<{ notifications: StaffNotification[] }> {
  const user = await ensureAuthenticatedServer();
  const supabase = await createClient();
  
  if (!user.activeClinicId) return { notifications: [] };

  const { data, error } = await supabase
    .from('staff_notifications')
    .select('*')
    .eq('clinic_id', user.activeClinicId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return { notifications: data.map(mapNotification) };
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from('staff_notifications')
    .update({ status: 'read', read_at: new Date().toISOString() })
    .eq('id', notificationId);
}

export async function getUnreadNotificationCount(): Promise<number> {
  const user = await ensureAuthenticatedServer();
  const supabase = await createClient();
  if (!user.activeClinicId) return 0;

  const { count, error } = await supabase
    .from('staff_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('clinic_id', user.activeClinicId)
    .eq('user_id', user.id)
    .eq('status', 'unread');

  if (error) return 0;
  return count || 0;
}

// --- Helpers ---

export async function queueAppointmentReminder(input: { appointmentId: string; hoursBefore?: number }): Promise<void> {
  const supabase = await createClient();
  const user = await ensureAuthenticatedServer();

  const { data: appt, error } = await supabase
    .from('appointments')
    .select(`
      id, 
      clinic_id, 
      start_time, 
      patient_id, 
      patients (
        first_name, 
        cell_number, 
        email
      )
    `)
    .eq('id', input.appointmentId)
    .single();

  if (error || !appt) {
    console.error('Reminder failed: Appointment not found', error);
    return;
  }

  const patient = appt.patients as any;
  let contact = patient?.cell_number;
  let channel = 'sms';
  if (!contact && patient?.email) {
    contact = patient.email;
    channel = 'email';
  }

  if (!contact) {
    console.warn(`Reminder skipped: No contact info for patient in appointment ${input.appointmentId}`);
    return;
  }

  const hours = input.hoursBefore || 24;
  const startTime = new Date(appt.start_time);
  const sendTime = new Date(startTime.getTime() - hours * 60 * 60 * 1000);
  
  const plannedSendAt = sendTime < new Date() ? new Date().toISOString() : sendTime.toISOString();

  const { data: msg } = await supabase.from('outbound_messages').insert({
    clinic_id: appt.clinic_id,
    patient_id: appt.patient_id,
    appointment_id: appt.id,
    channel: channel,
    recipient_name: patient?.first_name || 'Patient',
    recipient_contact: contact,
    subject: channel === 'email' ? 'Appointment Reminder' : null,
    body: `Reminder: You have an appointment tomorrow at ${startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.`,
    planned_send_at: plannedSendAt,
    send_after_event: 'appointment_booked',
    created_by: user.id,
    status: 'queued'
  }).select('id').single();

  // Optionally audit automated messages? Maybe redundant if queueMessage does it. 
  // But here we do direct insert. Let's record.
  if (msg) {
    await recordAuditEvent({
      clinicId: appt.clinic_id,
      eventType: 'message.queued_auto',
      entityType: 'outbound_message',
      entityId: msg.id,
      metadata: { trigger: 'appointment_reminder' }
    });
  }
}

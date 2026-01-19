import { createClient } from '@/lib/server/supabase/server';
import { ensureAuthenticatedServer } from '@/lib/services/authService';
import { dbToAppProfile } from '@/lib/mappers/userProfile';
import type {
  CreateNotificationInput,
  CreateTemplateInput,
  DeliveryAttempt,
  ListMessagesQuery,
  MessageTemplate,
  OutboundMessage,
  QueueMessageInput,
  StaffNotification,
  UpdateTemplateInput,
  MessageChannel,
  MessageStatus
} from '@/lib/types/communications';

const supabase = createClient();

// --- Mappers ---
const dbToDeliveryAttempt = (db: any): DeliveryAttempt => ({
  id: db.id,
  clinicId: db.clinic_id,
  messageId: db.message_id,
  status: db.status,
  attemptNumber: db.attempt_number,
  attemptedAt: db.attempted_at,
  provider: db.provider,
  providerMessageId: db.provider_message_id,
  error: db.error,
});

const dbToOutboundMessage = (db: any): OutboundMessage => ({
  id: db.id,
  clinicId: db.clinic_id,
  patientId: db.patient_id,
  appointmentId: db.appointment_id,
  invoiceId: db.invoice_id,
  recipientName: db.recipient_name,
  recipientContact: db.recipient_contact,
  channel: db.channel,
  subject: db.subject,
  body: db.body,
  plannedSendAt: db.planned_send_at,
  sendAfterEvent: db.send_after_event,
  status: db.status,
  sentAt: db.sent_at,
  failedAt: db.failed_at,
  failureReason: db.failure_reason,
  cancelledAt: db.cancelled_at,
  createdBy: db.created_by,
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

const dbToMessageTemplate = (db: any): MessageTemplate => ({
  id: db.id,
  clinicId: db.clinic_id,
  name: db.name,
  channel: db.channel,
  subject: db.subject,
  body: db.body,
  isActive: db.is_active,
  createdBy: db.created_by,
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

const dbToStaffNotification = (db: any): StaffNotification => ({
  id: db.id,
  clinicId: db.clinic_id,
  userId: db.user_id,
  title: db.title,
  body: db.body,
  linkUrl: db.link_url,
  status: db.status,
  createdAt: db.created_at,
  readAt: db.read_at,
});

// --- Message Templates ---

export async function listMessageTemplates(): Promise<{ templates: MessageTemplate[] }> {
  const currentUser = await ensureAuthenticatedServer();
  
  const { data, error } = await supabase
    .from('message_templates')
    .select('*')
    .eq('clinic_id', currentUser.activeClinicId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching message templates:', error);
    return { templates: [] };
  }

  return { templates: (data || []).map(dbToMessageTemplate) };
}

export async function createMessageTemplate(input: CreateTemplateInput): Promise<{ template: MessageTemplate }> {
  const currentUser = await ensureAuthenticatedServer();
  
  const { data, error } = await supabase
    .from('message_templates')
    .insert({
      name: input.name,
      channel: input.channel,
      subject: input.subject || null,
      body: input.body,
      is_active: true,
      clinic_id: currentUser.activeClinicId,
      created_by: currentUser.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating message template:', error);
    throw new Error('Failed to create message template');
  }

  return { template: dbToMessageTemplate(data) };
}

export async function updateMessageTemplate(templateId: string, input: UpdateTemplateInput): Promise<{ template: MessageTemplate }> {
  const { data, error } = await supabase
    .from('message_templates')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', templateId)
    .select()
    .single();

  if (error) {
    console.error('Error updating message template:', error);
    throw new Error('Failed to update message template');
  }

  return { template: dbToMessageTemplate(data) };
}

// --- Outbound Messages ---

export async function listMessages(query: ListMessagesQuery = {}): Promise<{ messages: OutboundMessage[] }> {
  const currentUser = await ensureAuthenticatedServer();
  
  let supabaseQuery = supabase
    .from('outbound_messages')
    .select(`
      *,
      patient:patients(name)
    `)
    .eq('clinic_id', currentUser.activeClinicId)
    .order('created_at', { ascending: false });

  if (query.patientId) {
    supabaseQuery = supabaseQuery.eq('patient_id', query.patientId);
  }

  if (query.status) {
    supabaseQuery = supabaseQuery.eq('status', query.status);
  }

  if (query.limit) {
    supabaseQuery = supabaseQuery.limit(query.limit);
  }

  const { data, error } = await supabaseQuery;

  if (error) {
    console.error('Error fetching messages:', error);
    return { messages: [] };
  }

  const messages = (data || []).map((db: any) => ({
    ...dbToOutboundMessage(db),
    patientName: db.patient?.name,
  }));

  // Apply offset manually if needed
  if (query.offset && query.offset > 0) {
    return { messages: messages.slice(query.offset) };
  }

  return { messages };
}

export async function queueMessage(input: QueueMessageInput): Promise<{ message: OutboundMessage }> {
  const currentUser = await ensureAuthenticatedServer();
  
  const { data, error } = await supabase
    .from('outbound_messages')
    .insert({
      patient_id: input.patientId || null,
      appointment_id: input.appointmentId || null,
      invoice_id: input.invoiceId || null,
      recipient_name: input.recipientName || null,
      recipient_contact: input.recipientContact || null,
      channel: input.channel,
      subject: input.subject || null,
      body: input.body,
      planned_send_at: input.plannedSendAt || null,
      status: 'queued' as MessageStatus,
      clinic_id: currentUser.activeClinicId,
      created_by: currentUser.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error queuing message:', error);
    throw new Error('Failed to queue message');
  }

  return { message: dbToOutboundMessage(data) };
}

export async function cancelMessage(messageId: string): Promise<{ message: OutboundMessage }> {
  const { data, error } = await supabase
    .from('outbound_messages')
    .update({
      status: 'cancelled' as MessageStatus,
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .select()
    .single();

  if (error) {
    console.error('Error cancelling message:', error);
    throw new Error('Failed to cancel message');
  }

  return { message: dbToOutboundMessage(data) };
}

export async function markMessageSent(messageId: string): Promise<{ message: OutboundMessage }> {
  const { data, error } = await supabase
    .from('outbound_messages')
    .update({
      status: 'sent' as MessageStatus,
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .select()
    .single();

  if (error) {
    console.error('Error marking message as sent:', error);
    throw new Error('Failed to mark message as sent');
  }

  return { message: dbToOutboundMessage(data) };
}

export async function markMessageFailed(messageId: string, failureReason?: string): Promise<{ message: OutboundMessage }> {
  const { data, error } = await supabase
    .from('outbound_messages')
    .update({
      status: 'failed' as MessageStatus,
      failed_at: new Date().toISOString(),
      failure_reason: failureReason || 'Unknown error',
      updated_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .select()
    .single();

  if (error) {
    console.error('Error marking message as failed:', error);
    throw new Error('Failed to mark message as failed');
  }

  return { message: dbToOutboundMessage(data) };
}

// --- Notifications ---

export async function listNotifications(): Promise<{ notifications: StaffNotification[] }> {
  const currentUser = await ensureAuthenticatedServer();
  
  const { data, error } = await supabase
    .from('staff_notifications')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error);
    return { notifications: [] };
  }

  return { notifications: (data || []).map(dbToStaffNotification) };
}

export async function markNotificationRead(notificationId: string): Promise<{ notification: StaffNotification }> {
  const { data, error } = await supabase
    .from('staff_notifications')
    .update({
      status: 'read',
      read_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', notificationId)
    .select()
    .single();

  if (error) {
    console.error('Error marking notification as read:', error);
    throw new Error('Failed to mark notification as read');
  }

  return { notification: dbToStaffNotification(data) };
}

// --- Appointment Reminders ---

export async function queueAppointmentReminder(appointmentId: string, reminderChannel: MessageChannel = 'sms'): Promise<{ message: OutboundMessage }> {
  const currentUser = await ensureAuthenticatedServer();
  
  // Get appointment details
  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .select(`
      *,
      patient:patients(name, phone, email)
    `)
    .eq('id', appointmentId)
    .single();

  if (appointmentError || !appointment) {
    console.error('Error fetching appointment:', appointmentError);
    throw new Error('Appointment not found');
  }

  // Determine recipient contact
  const recipientContact = reminderChannel === 'sms' 
    ? appointment.patient.phone 
    : appointment.patient.email;

  if (!recipientContact) {
    throw new Error(`No ${reminderChannel} contact available for patient`);
  }

  // Create reminder message
  const appointmentDate = new Date(appointment.scheduled_time);
  const subject = `Appointment Reminder - ${appointmentDate.toLocaleDateString()}`;
  const body = `Reminder: You have an appointment scheduled for ${appointmentDate.toLocaleString()}.`;

  const { data, error } = await supabase
    .from('outbound_messages')
    .insert({
      patient_id: appointment.patient_id,
      appointment_id: appointmentId,
      recipient_name: appointment.patient.name,
      recipient_contact: recipientContact,
      channel: reminderChannel,
      subject,
      body,
      planned_send_at: appointmentDate.toISOString(), // Send reminder before appointment
      status: 'queued' as MessageStatus,
      clinic_id: currentUser.activeClinicId,
      created_by: currentUser.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error queuing appointment reminder:', error);
    throw new Error('Failed to queue appointment reminder');
  }

  return { message: dbToOutboundMessage(data) };
}
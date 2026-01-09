
export type MessageChannel = 'sms' | 'email' | 'whatsapp' | 'in_app';
export type MessageStatus = 'queued' | 'sending' | 'sent' | 'failed' | 'cancelled';
export type NotificationStatus = 'unread' | 'read';

export interface MessageTemplate {
  id: string;
  clinicId: string;
  name: string;
  channel: MessageChannel;
  subject: string | null;
  body: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface OutboundMessage {
  id: string;
  clinicId: string;
  patientId: string | null;
  appointmentId: string | null;
  invoiceId: string | null;
  
  recipientName: string | null;
  recipientContact: string | null;
  channel: MessageChannel;
  subject: string | null;
  body: string;
  
  plannedSendAt: string | null;
  sendAfterEvent: string | null;
  
  status: MessageStatus;
  sentAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  cancelledAt: string | null;
  
  createdBy: string;
  createdAt: string;
  updatedAt: string;

  // Joined
  patientName?: string;
  creatorName?: string;
}

export interface DeliveryAttempt {
  id: string;
  clinicId: string;
  messageId: string;
  attemptNumber: number;
  attemptedAt: string;
  provider: string | null;
  providerMessageId: string | null;
  status: 'sent' | 'failed';
  error: string | null;
}

export interface StaffNotification {
  id: string;
  clinicId: string;
  userId: string;
  title: string;
  body: string | null;
  linkUrl: string | null;
  status: NotificationStatus;
  createdAt: string;
  readAt: string | null;
}

// --- Inputs ---

export interface CreateTemplateInput {
  name: string;
  channel: MessageChannel;
  subject?: string;
  body: string;
}

export interface UpdateTemplateInput {
  name?: string;
  channel?: MessageChannel;
  subject?: string;
  body?: string;
  isActive?: boolean;
}

export interface QueueMessageInput {
  patientId?: string;
  appointmentId?: string;
  invoiceId?: string;
  recipientName?: string;
  recipientContact?: string;
  channel: MessageChannel;
  subject?: string;
  body: string;
  plannedSendAt?: string | null;
}

export interface ListMessagesQuery {
  clinicId?: string;
  patientId?: string;
  status?: MessageStatus;
  from?: string; // date
  to?: string;   // date
  limit?: number;
  offset?: number;
}

export interface CreateNotificationInput {
  userId: string;
  title: string;
  body?: string;
  linkUrl?: string;
}

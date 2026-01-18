import { createClient } from '@/lib/supabase/server';
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
  UpdateTemplateInput
} from '@/lib/types/communications';
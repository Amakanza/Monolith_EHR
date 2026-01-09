
import 'server-only';
import { createClient } from '@/lib/server/supabase/server';
import { getActiveClinic } from '@/lib/server/clinic/get-active-clinic';
import { z } from 'zod';

export type AuditAction = 
  | 'create' | 'update' | 'delete' | 'archive' | 'unarchive'
  | 'finalize' | 'send' | 'void' | 'pay' | 'join' | 'generate';

export interface LogEventInput {
  action: string; // Open string to allow flexibility, but usually follows pattern
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, any>;
}

export async function logEvent(input: LogEventInput) {
  try {
    // We try/catch inside to prevent audit failures from blocking main business logic
    // unless strict compliance is required. For MVP, we log errors to console.
    const { clinicId, user } = await getActiveClinic();
    const supabase = await createClient();

    const { error } = await supabase.from('audit_events').insert({
      clinic_id: clinicId,
      actor_user_id: user.id,
      event_type: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId,
      metadata: input.metadata || {},
      // Assuming actor_role is optional or nullable in schema, or we'd fetch it. 
      // For MVP we rely on DB default or nullable.
    });

    if (error) {
      console.error('Failed to log audit event:', error);
    }
  } catch (e) {
    console.error('Error logging audit event:', e);
  }
}

export const listEventsSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  entityType: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

export type ListEventsInput = z.infer<typeof listEventsSchema>;

export async function listEvents(input: ListEventsInput) {
  const { clinicId } = await getActiveClinic();
  const supabase = await createClient();

  let query = supabase
    .from('audit_events')
    .select('*, user_profiles(full_name)')
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false })
    .range(input.offset, input.offset + input.limit - 1);

  if (input.from) {
    query = query.gte('created_at', input.from);
  }
  if (input.to) {
    query = query.lte('created_at', input.to);
  }
  if (input.entityType) {
    query = query.eq('entity_type', input.entityType);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}
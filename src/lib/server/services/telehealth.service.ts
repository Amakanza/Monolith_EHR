
import 'server-only';
import { createClient } from '@/lib/server/supabase/server';
import { createServiceClient } from '@/lib/server/supabase/service';
import { getActiveClinic } from '@/lib/server/clinic/get-active-clinic';
import { randomBytes, createHash } from 'crypto';
import { z } from 'zod';
import { logEvent } from './audit.service';

export const createSessionSchema = z.object({
  appointmentId: z.string().uuid(),
});

export async function createSession(appointmentId: string) {
  const { clinicId, user } = await getActiveClinic();
  const supabase = await createClient();

  // Check appointment ownership/existence
  const { data: appointment, error: aptError } = await supabase
    .from('appointments')
    .select('id')
    .eq('id', appointmentId)
    .eq('clinic_id', clinicId)
    .single();

  if (aptError || !appointment) {
    throw new Error('Appointment not found or access denied');
  }

  // Check if session already exists
  const existing = await getSessionByAppointment(appointmentId);
  if (existing) return existing;

  const token = randomBytes(32).toString('hex');

  const { data, error } = await supabase
    .from('telehealth_sessions')
    .insert({
      clinic_id: clinicId,
      appointment_id: appointmentId,
      join_token: token,
      // created_by: user.id // Assuming table has this, if not schema will reject. 
      // Safe to omit if not in migration, but usually good for audit. 
      // MVP: schema likely minimalistic based on prompt.
    })
    .select()
    .single();

  if (error) throw error;

  await logEvent({
    action: 'create',
    entityType: 'telehealth_session',
    entityId: data.id,
  });

  return data;
}

export async function getSessionByAppointment(appointmentId: string) {
  const { clinicId } = await getActiveClinic();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('telehealth_sessions')
    .select('*')
    .eq('appointment_id', appointmentId)
    .eq('clinic_id', clinicId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function verifyJoinToken(token: string) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('telehealth_sessions')
    .select(`
      *,
      appointments (
        start_time,
        patients (first_name)
      )
    `)
    .eq('join_token', token)
    .single();

  if (error || !data) {
    throw new Error('Invalid token');
  }

  return data;
}

export async function logJoin(params: { token: string; userAgent: string; ip: string }) {
  const supabase = createServiceClient();
  
  // Retrieve session ID first (to link log)
  const { data: session } = await supabase
    .from('telehealth_sessions')
    .select('id')
    .eq('join_token', params.token)
    .single();

  if (!session) return; // Should have been verified already

  const ipHash = createHash('sha256').update(params.ip).digest('hex');

  await supabase.from('telehealth_join_logs').insert({
    session_id: session.id,
    token_used: params.token,
    user_agent: params.userAgent,
    ip_hash: ipHash,
  });
}
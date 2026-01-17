
import { createClient } from '@/lib/server/supabase/server';
import { ensureAuthenticatedServer } from '@/lib/services/authService';
import { 
  CreateTelehealthSessionInput, 
  ListSessionsQuery, 
  TelehealthJoinLog, 
  TelehealthSession, 
  UpdateTelehealthSessionInput 
} from '@/lib/types/telehealth';
import { randomUUID } from 'crypto';
import { recordAuditEvent } from '@/lib/services/reportingService';

// --- Mappers ---

function mapSession(row: any): TelehealthSession {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    appointmentId: row.appointment_id,
    patientId: row.patient_id,
    clinicianId: row.clinician_id,
    provider: row.provider,
    joinUrl: row.join_url,
    hostUrl: row.host_url,
    meetingId: row.meeting_id,
    passcode: row.passcode,
    patientJoinToken: row.patient_join_token,
    patientJoinExpiresAt: row.patient_join_expires_at,
    isActive: row.is_active,
    status: row.status,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    patientName: row.patients ? `${row.patients.first_name} ${row.patients.last_name}` : undefined,
    clinicianName: row.user_profiles ? row.user_profiles.full_name : undefined,
    appointmentStartTime: row.appointments ? row.appointments.start_time : undefined,
  };
}

function mapLog(row: any): TelehealthJoinLog {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    sessionId: row.session_id,
    joinedAt: row.joined_at,
    actorType: row.actor_type,
    actorUserId: row.actor_user_id,
    patientTokenUsed: row.patient_token_used,
    ipHash: row.ip_hash,
    userAgent: row.user_agent,
    status: row.status,
    error: row.error,
    actorName: row.user_profiles ? row.user_profiles.full_name : undefined
  };
}

// --- Management ---

export async function createTelehealthSession(input: CreateTelehealthSessionInput & { clinicId?: string }): Promise<{ session: TelehealthSession }> {
  const user = await ensureAuthenticatedServer();
  const supabase = await createClient();
  const clinicId = input.clinicId || user.activeClinicId;
  if (!clinicId) throw new Error('ACTIVE_CLINIC_REQUIRED');

  const { data: appt, error: apptError } = await supabase
    .from('appointments')
    .select('patient_id, clinician_id')
    .eq('id', input.appointmentId)
    .eq('clinic_id', clinicId)
    .single();

  if (apptError || !appt) throw new Error('APPOINTMENT_NOT_FOUND_OR_ACCESS_DENIED');

  let token = null;
  if (input.patientJoinEnabled) {
    token = randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '');
  }

  const { data, error } = await supabase
    .from('telehealth_sessions')
    .insert({
      clinic_id: clinicId,
      appointment_id: input.appointmentId,
      patient_id: appt.patient_id,
      clinician_id: appt.clinician_id,
      provider: input.provider,
      join_url: input.joinUrl,
      host_url: input.hostUrl,
      meeting_id: input.meetingId,
      passcode: input.passcode,
      patient_join_token: token,
      patient_join_expires_at: input.patientJoinExpiresAt,
      created_by: user.id
    })
    .select('*, patients(first_name, last_name), user_profiles!clinician_id(full_name), appointments(start_time)')
    .single();

  if (error) {
    if (error.code === '23505') throw new Error('SESSION_ALREADY_EXISTS_FOR_APPOINTMENT');
    throw new Error(error.message);
  }

  await recordAuditEvent({
    clinicId,
    eventType: 'telehealth.created',
    entityType: 'telehealth_session',
    entityId: data.id,
    metadata: { provider: input.provider }
  });

  return { session: mapSession(data) };
}

export async function updateTelehealthSession(sessionId: string, input: UpdateTelehealthSessionInput): Promise<{ session: TelehealthSession }> {
  const supabase = await createClient();

  const updates: any = {};
  if (input.joinUrl !== undefined) updates.join_url = input.joinUrl;
  if (input.hostUrl !== undefined) updates.host_url = input.hostUrl;
  if (input.status !== undefined) {
    updates.status = input.status;
    if (input.status === 'live') updates.started_at = new Date().toISOString();
    if (input.status === 'ended') updates.ended_at = new Date().toISOString();
  }
  if (input.isActive !== undefined) updates.is_active = input.isActive;
  if (input.patientJoinExpiresAt !== undefined) updates.patient_join_expires_at = input.patientJoinExpiresAt;
  
  if (input.regenerateToken) {
    updates.patient_join_token = randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '');
  }

  const { data, error } = await supabase
    .from('telehealth_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select('*, patients(first_name, last_name), user_profiles!clinician_id(full_name), appointments(start_time)')
    .single();

  if (error) throw new Error(error.message);
  return { session: mapSession(data) };
}

export async function getSessionById(sessionId: string): Promise<{ session: TelehealthSession }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('telehealth_sessions')
    .select('*, patients(first_name, last_name), user_profiles!clinician_id(full_name), appointments(start_time)')
    .eq('id', sessionId)
    .single();

  if (error || !data) throw new Error('SESSION_NOT_FOUND');
  return { session: mapSession(data) };
}

export async function getSessionByAppointment(appointmentId: string): Promise<{ session: TelehealthSession | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('telehealth_sessions')
    .select('*, patients(first_name, last_name), user_profiles!clinician_id(full_name), appointments(start_time)')
    .eq('appointment_id', appointmentId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return { session: data ? mapSession(data) : null };
}

export async function listSessions(query: ListSessionsQuery): Promise<{ sessions: TelehealthSession[] }> {
  const user = await ensureAuthenticatedServer();
  const supabase = await createClient();
  const clinicId = query.clinicId || user.activeClinicId;
  if (!clinicId) throw new Error('ACTIVE_CLINIC_REQUIRED');

  let dbQuery = supabase
    .from('telehealth_sessions')
    .select('*, patients(first_name, last_name), user_profiles!clinician_id(full_name), appointments(start_time)')
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false });

  if (query.clinicianId) dbQuery = dbQuery.eq('clinician_id', query.clinicianId);
  if (query.patientId) dbQuery = dbQuery.eq('patient_id', query.patientId);
  if (query.status) dbQuery = dbQuery.eq('status', query.status);
  
  if (query.limit) dbQuery = dbQuery.limit(query.limit);
  if (query.offset) dbQuery = dbQuery.range(query.offset, query.offset + (query.limit || 20) - 1);

  const { data, error } = await dbQuery;
  if (error) throw new Error(error.message);

  return { sessions: data.map(mapSession) };
}

// --- Join & Logs ---

export async function validatePatientJoin(token: string, userAgent?: string): Promise<{ session: TelehealthSession; joinUrl: string }> {
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
  const serviceClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: session, error } = await serviceClient
    .from('telehealth_sessions')
    .select('*, appointments(start_time)')
    .eq('patient_join_token', token)
    .single();

  const logAttempt = async (status: 'success' | 'denied' | 'error', errorMsg?: string, sessionId?: string, clinicId?: string) => {
    if (!sessionId || !clinicId) return;
    await serviceClient.from('telehealth_join_logs').insert({
      clinic_id: clinicId,
      session_id: sessionId,
      actor_type: 'patient',
      patient_token_used: token,
      user_agent: userAgent,
      status,
      error: errorMsg
    });
  };

  if (error || !session) {
    throw new Error('INVALID_TOKEN');
  }

  if (!session.is_active) {
    await logAttempt('denied', 'Session inactive', session.id, session.clinic_id);
    throw new Error('SESSION_INACTIVE');
  }
  if (session.status === 'cancelled' || session.status === 'ended') {
    await logAttempt('denied', 'Session ended or cancelled', session.id, session.clinic_id);
    throw new Error('SESSION_ENDED');
  }
  if (session.patient_join_expires_at && new Date(session.patient_join_expires_at) < new Date()) {
    await logAttempt('denied', 'Token expired', session.id, session.clinic_id);
    throw new Error('TOKEN_EXPIRED');
  }

  await logAttempt('success', undefined, session.id, session.clinic_id);
  
  return { 
    session: mapSession(session),
    joinUrl: session.join_url 
  };
}

export async function listJoinLogs(sessionId: string): Promise<{ logs: TelehealthJoinLog[] }> {
  const user = await ensureAuthenticatedServer();
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('telehealth_join_logs')
    .select('*, user_profiles(full_name)')
    .eq('session_id', sessionId)
    .order('joined_at', { ascending: false });

  if (error) throw new Error(error.message);
  return { logs: data.map(mapLog) };
}

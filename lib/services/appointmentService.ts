
import { createClient } from '@/lib/supabase/server';
import { dbToAppProfile } from '@/lib/mappers/userProfile';
import { 
  Appointment, 
  AppointmentType, 
  AppointmentStatus,
  CreateAppointmentInput, 
  UpdateAppointmentInput,
  CancelAppointmentInput,
  CreateAppointmentTypeInput,
  UpdateAppointmentTypeInput,
  ListAppointmentsQuery
} from '@/lib/types/appointments';
import { ensureAuthenticatedServer } from '@/lib/services/authService';
import { queueAppointmentReminder } from '@/lib/services/communicationsService';
import { recordAuditEvent } from '@/lib/services/reportingService';

// --- Mappers ---

function mapAppointmentType(row: any): AppointmentType {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    name: row.name,
    defaultDurationMinutes: row.default_duration_minutes,
    color: row.color,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAppointment(row: any): Appointment {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    clinicianId: row.clinician_id,
    appointmentTypeId: row.appointment_type_id,
    startTime: row.start_time,
    endTime: row.end_time,
    timezone: row.timezone,
    status: row.status as AppointmentStatus,
    cancellationReason: row.cancellation_reason,
    cancelledAt: row.cancelled_at,
    completedAt: row.completed_at,
    noShowAt: row.no_show_at,
    internalNote: row.internal_note,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    patientName: row.patients?.fullName || 'Unknown',
    clinicianName: row.user_profiles ? dbToAppProfile(row.user_profiles)?.fullName || 'Unknown' : 'Unknown',
    appointmentTypeName: row.appointment_types ? row.appointment_types.name : undefined
  };
}

function handleDbError(error: any) {
  if (error.code === '23P01') { 
    throw new Error('APPOINTMENT_OVERLAP: This time slot is already booked for the selected clinician.');
  }
  throw new Error(error.message);
}

// --- Service Functions ---

export async function createAppointment(input: CreateAppointmentInput & { clinicId?: string }): Promise<{ appointment: Appointment }> {
  const user = await ensureAuthenticatedServer();
  const supabase = await createClient();
  
  const clinicId = input.clinicId || user.activeClinicId;
  if (!clinicId) throw new Error('ACTIVE_CLINIC_REQUIRED');

  if (input.endTime <= input.startTime) {
    throw new Error('End time must be after start time');
  }

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      clinic_id: clinicId,
      patient_id: input.patientId,
      clinician_id: input.clinicianId,
      appointment_type_id: input.appointmentTypeId,
      start_time: input.startTime,
      end_time: input.endTime,
      internal_note: input.internalNote,
      created_by: user.id,
      status: 'booked'
    })
    .select('*, patients(first_name, last_name), user_profiles(full_name), appointment_types(name)')
    .single();

  if (error) handleDbError(error);

  const appt = mapAppointment(data);

  await recordAuditEvent({
    clinicId,
    eventType: 'appointment.created',
    entityType: 'appointment',
    entityId: appt.id,
    metadata: { patientId: input.patientId, start: input.startTime }
  });

  try {
    await queueAppointmentReminder({ appointmentId: appt.id });
  } catch (e) {
    console.error('Failed to queue appointment reminder', e);
  }

  return { appointment: appt };
}

export async function updateAppointment(appointmentId: string, input: UpdateAppointmentInput): Promise<{ appointment: Appointment }> {
  const supabase = await createClient();

  const { data: current, error: fetchError } = await supabase
    .from('appointments')
    .select('status')
    .eq('id', appointmentId)
    .single();
  
  if (fetchError || !current) throw new Error('APPOINTMENT_NOT_FOUND');
  
  if (current.status !== 'booked') {
     if (input.startTime || input.endTime || input.clinicianId) {
        throw new Error('Cannot reschedule an appointment that is cancelled or completed.');
     }
  }

  const updates: any = {};
  if (input.clinicianId) updates.clinician_id = input.clinicianId;
  if (input.appointmentTypeId) updates.appointment_type_id = input.appointmentTypeId;
  if (input.startTime) updates.start_time = input.startTime;
  if (input.endTime) updates.end_time = input.endTime;
  if (input.internalNote !== undefined) updates.internal_note = input.internalNote;

  const { data, error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', appointmentId)
    .select('*, patients(first_name, last_name), user_profiles(full_name), appointment_types(name)')
    .single();

  if (error) handleDbError(error);

  await recordAuditEvent({
    clinicId: data.clinic_id,
    eventType: 'appointment.updated',
    entityType: 'appointment',
    entityId: data.id,
    metadata: { updates: Object.keys(input) }
  });

  return { appointment: mapAppointment(data) };
}

export async function cancelAppointment(appointmentId: string, input: CancelAppointmentInput): Promise<{ appointment: Appointment }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('appointments')
    .update({
      status: 'cancelled',
      cancellation_reason: input.reason,
      cancelled_at: new Date().toISOString()
    })
    .eq('id', appointmentId)
    .select('*, patients(first_name, last_name), user_profiles(full_name), appointment_types(name)')
    .single();

  if (error) throw new Error(error.message);
  
  await recordAuditEvent({
    clinicId: data.clinic_id,
    eventType: 'appointment.cancelled',
    entityType: 'appointment',
    entityId: data.id,
    metadata: { reason: input.reason }
  });

  return { appointment: mapAppointment(data) };
}

export async function markAppointmentCompleted(appointmentId: string): Promise<{ appointment: Appointment }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('appointments')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', appointmentId)
    .select('*, patients(first_name, last_name), user_profiles(full_name), appointment_types(name)')
    .single();

  if (error) throw new Error(error.message);

  await recordAuditEvent({
    clinicId: data.clinic_id,
    eventType: 'appointment.completed',
    entityType: 'appointment',
    entityId: data.id
  });

  return { appointment: mapAppointment(data) };
}

export async function markAppointmentNoShow(appointmentId: string): Promise<{ appointment: Appointment }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('appointments')
    .update({
      status: 'no_show',
      no_show_at: new Date().toISOString()
    })
    .eq('id', appointmentId)
    .select('*, patients(first_name, last_name), user_profiles(full_name), appointment_types(name)')
    .single();

  if (error) throw new Error(error.message);

  await recordAuditEvent({
    clinicId: data.clinic_id,
    eventType: 'appointment.no_show',
    entityType: 'appointment',
    entityId: data.id
  });

  return { appointment: mapAppointment(data) };
}

export async function getAppointmentById(appointmentId: string): Promise<{ appointment: Appointment }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('appointments')
    .select('*, patients(first_name, last_name), user_profiles(full_name), appointment_types(name)')
    .eq('id', appointmentId)
    .single();

  if (error || !data) throw new Error('APPOINTMENT_NOT_FOUND');

  return { appointment: mapAppointment(data) };
}

export async function listAppointments(query: ListAppointmentsQuery): Promise<{ appointments: Appointment[] }> {
  const user = await ensureAuthenticatedServer();
  const supabase = await createClient();

  const clinicId = query.clinicId || user.activeClinicId;
  if (!clinicId) throw new Error('ACTIVE_CLINIC_REQUIRED');

  let dbQuery = supabase
    .from('appointments')
    .select('*, patients(first_name, last_name), user_profiles(full_name), appointment_types(name)')
    .eq('clinic_id', clinicId)
    .order('start_time', { ascending: true });

  if (query.clinicianId) dbQuery = dbQuery.eq('clinician_id', query.clinicianId);
  if (query.patientId) dbQuery = dbQuery.eq('patient_id', query.patientId);
  if (query.status) dbQuery = dbQuery.eq('status', query.status);
  
  if (query.from) dbQuery = dbQuery.gte('start_time', query.from);
  if (query.to) dbQuery = dbQuery.lte('start_time', query.to);

  const { data, error } = await dbQuery;

  if (error) throw new Error(error.message);

  return { appointments: data.map(mapAppointment) };
}

// --- Appointment Types ---

export async function createAppointmentType(input: CreateAppointmentTypeInput & { clinicId?: string }): Promise<{ appointmentType: AppointmentType }> {
  const user = await ensureAuthenticatedServer();
  const supabase = await createClient();
  
  const clinicId = input.clinicId || user.activeClinicId;
  if (!clinicId) throw new Error('ACTIVE_CLINIC_REQUIRED');

  const { data, error } = await supabase
    .from('appointment_types')
    .insert({
      clinic_id: clinicId,
      name: input.name,
      default_duration_minutes: input.defaultDurationMinutes,
      color: input.color,
      created_by: user.id
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return { appointmentType: mapAppointmentType(data) };
}

export async function listAppointmentTypes(input: { clinicId?: string; includeInactive?: boolean } = {}): Promise<{ appointmentTypes: AppointmentType[] }> {
  const user = await ensureAuthenticatedServer();
  const supabase = await createClient();

  const clinicId = input.clinicId || user.activeClinicId;
  if (!clinicId) throw new Error('ACTIVE_CLINIC_REQUIRED');

  let dbQuery = supabase
    .from('appointment_types')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('name');

  if (!input.includeInactive) {
    dbQuery = dbQuery.eq('is_active', true);
  }

  const { data, error } = await dbQuery;
  if (error) throw new Error(error.message);

  return { appointmentTypes: data.map(mapAppointmentType) };
}

export async function updateAppointmentType(id: string, input: UpdateAppointmentTypeInput): Promise<{ appointmentType: AppointmentType }> {
  const supabase = await createClient();

  const updates: any = {};
  if (input.name) updates.name = input.name;
  if (input.defaultDurationMinutes) updates.default_duration_minutes = input.defaultDurationMinutes;
  if (input.color !== undefined) updates.color = input.color;
  if (input.isActive !== undefined) updates.is_active = input.isActive;

  const { data, error } = await supabase
    .from('appointment_types')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return { appointmentType: mapAppointmentType(data) };
}

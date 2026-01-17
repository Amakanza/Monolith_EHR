import { createClient } from '@/lib/supabase/server';
import { 
  Appointment, 
  AppointmentType, 
  AppointmentStatus,
  CreateAppointmentInput, 
  UpdateAppointmentInput,
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
    startTime: row.start_time || row.scheduled_start,
    endTime: row.end_time || row.scheduled_end,
    timezone: row.timezone || 'UTC',
    status: row.status,
    cancellationReason: row.cancellation_reason,
    cancelledAt: row.cancelled_at,
    completedAt: row.completed_at,
    noShowAt: row.no_show_at,
    internalNote: row.internal_note,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// --- Appointment Types ---

export async function listAppointmentTypes(): Promise<AppointmentType[]> {
  const supabase = createClient();
  const user = await ensureAuthenticatedServer();
  
  const { data, error } = await supabase
    .from('appointment_types')
    .select('*')
    .eq('clinic_id', user.activeClinicId)
    .eq('is_active', true)
    .order('name');

  if (error) throw new Error(error.message);
  
  return data ? data.map(mapAppointmentType) : [];
}

// --- Appointments ---

export async function listAppointments(query?: ListAppointmentsQuery): Promise<Appointment[]> {
  const supabase = createClient();
  const user = await ensureAuthenticatedServer();
  
  let dbQuery = supabase
    .from('appointments')
    .select(`
      *,
      appointment_types (
        id,
        name,
        color
      ),
      patients (
        id,
        first_name,
        last_name,
        date_of_birth
      )
    `)
    .eq('clinic_id', user.activeClinicId)
    .order('start_time', { ascending: true });

  // Filter by date range if provided
  if (query?.from || query?.to) {
    if (query.from) {
      dbQuery = dbQuery.gte('start_time', query.from);
    }
    if (query.to) {
      dbQuery = dbQuery.lte('start_time', query.to);
    }
  }

  const { data, error } = await dbQuery;

  if (error) throw new Error(error.message);
  
  return data ? data.map(mapAppointment) : [];
}

export async function createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
  const supabase = createClient();
  const user = await ensureAuthenticatedServer();

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      clinic_id: user.activeClinicId,
      patient_id: input.patientId,
      clinician_id: input.clinicianId,
      appointment_type_id: input.appointmentTypeId,
      start_time: input.startTime,
      end_time: input.endTime,
      status: 'booked' as AppointmentStatus,
      internal_note: input.internalNote,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Time slot already booked.');
    }
    throw new Error(error.message);
  }

  // Queue reminder and audit
  try {
    await queueAppointmentReminder(data.id);
  } catch (e) {
    // Non-critical, continue
    console.warn('Failed to queue appointment reminder:', e);
  }
  
  try {
    await recordAuditEvent({
      clinicId: user.activeClinicId || '',
      eventType: 'APPOINTMENT_CREATED',
      entityType: 'appointment',
      entityId: data.id || '',
      metadata: input,
    });
  } catch (e) {
    // Non-critical, continue
    console.warn('Failed to record audit event:', e);
  }

  return mapAppointment(data);
}

export async function updateAppointment(
  id: string, 
  input: UpdateAppointmentInput
): Promise<Appointment> {
  const supabase = createClient();
  const user = await ensureAuthenticatedServer();

  const { data, error } = await supabase
    .from('appointments')
    .update({
      clinician_id: input.clinicianId,
      appointment_type_id: input.appointmentTypeId,
      start_time: input.startTime,
      end_time: input.endTime,
      internal_note: input.internalNote,
    })
    .eq('id', id)
    .eq('clinic_id', user.activeClinicId)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Time slot already booked.');
    }
    throw new Error(error.message);
  }

  try {
    await recordAuditEvent({
      clinicId: user.activeClinicId || '',
      eventType: 'APPOINTMENT_UPDATED',
      entityType: 'appointment',
      entityId: id,
      metadata: input,
    });
  } catch (e) {
    console.warn('Failed to record audit event:', e);
  }

  return mapAppointment(data);
}

export async function cancelAppointment(id: string): Promise<void> {
  const supabase = createClient();
  const user = await ensureAuthenticatedServer();

  const { error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' as AppointmentStatus })
    .eq('id', id)
    .eq('clinic_id', user.activeClinicId);

  if (error) throw new Error(error.message);

  try {
    await recordAuditEvent({
      clinicId: user.activeClinicId || '',
      eventType: 'APPOINTMENT_CANCELLED',
      entityType: 'appointment',
      entityId: id,
    });
  } catch (e) {
    console.warn('Failed to record audit event:', e);
  }
}
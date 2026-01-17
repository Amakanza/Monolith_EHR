
export type AppointmentStatus = 'booked' | 'cancelled' | 'completed' | 'no_show';

export interface AppointmentType {
  id: string;
  clinicId: string;
  name: string;
  defaultDurationMinutes: number;
  color: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  clinicId: string;
  patientId: string;
  clinicianId: string;
  appointmentTypeId: string | null;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  timezone: string;
  status: AppointmentStatus;
  cancellationReason: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
  noShowAt: string | null;
  internalNote: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  
  // Joins (optional, usually fetched for UI)
  patientName?: string;
  clinicianName?: string;
  appointmentTypeName?: string;
}

// --- Inputs ---

export interface CreateAppointmentInput {
  patientId: string;
  clinicianId: string;
  appointmentTypeId?: string;
  startTime: string;
  endTime: string; // or calculate from duration in service
  internalNote?: string;
}

export interface UpdateAppointmentInput {
  clinicianId?: string;
  appointmentTypeId?: string;
  startTime?: string;
  endTime?: string;
  internalNote?: string;
}

export interface CancelAppointmentInput {
  reason: string;
}

export interface CreateAppointmentTypeInput {
  name: string;
  defaultDurationMinutes: number;
  color?: string;
}

export interface UpdateAppointmentTypeInput {
  name?: string;
  defaultDurationMinutes?: number;
  color?: string;
  isActive?: boolean;
}

// --- Queries ---

export interface ListAppointmentsQuery {
  clinicId?: string;
  clinicianId?: string;
  patientId?: string;
  from?: string | Date; // ISO date
  to?: string | Date;   // ISO date
  status?: AppointmentStatus;
}

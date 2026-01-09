
export interface PublicClinicProfile {
  clinicId: string;
  slug: string;
  publicName: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  timezone: string;
}

export interface PublicAppointmentType {
  id: string;
  name: string;
  defaultDurationMinutes: number;
}

export interface AvailabilitySlot {
  startTime: string; // ISO
  endTime: string;   // ISO
  available: boolean;
}

export interface PublicBookingPayload {
  appointmentTypeId: string;
  startTime: string; // ISO
  patient: {
    firstName: string;
    lastName: string;
    cellNumber: string;
    email?: string;
    idOrPassport?: string;
  };
  notes?: string;
  honeypot?: string; // Anti-spam
}

export interface BookingResult {
  success: boolean;
  appointmentId?: string;
  message?: string;
}

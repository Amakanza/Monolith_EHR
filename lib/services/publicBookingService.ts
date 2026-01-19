import { createAdminClient } from '@/lib/supabase/admin';
import { AvailabilitySlot, BookingResult, PublicAppointmentType, PublicBookingPayload, PublicClinicProfile } from '@/lib/types/publicBooking';
import { createHash } from 'crypto';

// --- Mappers ---

function mapProfile(row: any): PublicClinicProfile {
  return {
    clinicId: row.clinic_id,
    slug: row.slug,
    publicName: row.public_name,
    description: row.description,
    phone: row.phone,
    email: row.email,
    address: row.address,
    timezone: row.timezone
  };
}

// --- Helpers ---

function hashIp(ip: string) {
  return createHash('sha256').update(ip).digest('hex');
}

// --- Core Functions ---

export async function getClinicPublicProfile(slug: string): Promise<PublicClinicProfile> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('clinic_public_profiles')
    .select('*')
    .eq('slug', slug)
    .eq('booking_enabled', true)
    .single();

  if (error || !data) throw new Error('Clinic not found or booking disabled');
  return mapProfile(data);
}

export async function listPublicAppointmentTypes(slug: string): Promise<PublicAppointmentType[]> {
  const profile = await getClinicPublicProfile(slug);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('appointment_types')
    .select('id, name, default_duration_minutes')
    .eq('clinic_id', profile.clinicId)
    .eq('is_active', true)
    .order('name');

  if (error) throw new Error(error.message);
  
  return data.map((d: any) => ({
    id: d.id,
    name: d.name,
    defaultDurationMinutes: d.default_duration_minutes
  }));
}

export async function getAvailability(
  slug: string, 
  date: string, 
  appointmentTypeId: string
): Promise<AvailabilitySlot[]> {
  const profile = await getClinicPublicProfile(slug);
  const supabase = createAdminClient();

  // 1. Get Duration
  const { data: typeData } = await supabase
    .from('appointment_types')
    .select('default_duration_minutes')
    .eq('id', appointmentTypeId)
    .single();
    
  if (!typeData) throw new Error('Invalid service');
  const duration = typeData.default_duration_minutes;

  // 2. Define Day Range (08:00 - 17:00)
  // Note: Handling timezones correctly requires care. 
  // For V1, we assume the input `date` (YYYY-MM-DD) is in the clinic's timezone context.
  // We will generate ISO strings combining date + time.
  const startOfDay = new Date(`${date}T08:00:00`);
  const endOfDay = new Date(`${date}T17:00:00`);

  // 3. Fetch Clinicians
  // Any member with role 'clinician' or 'owner' is considered a candidate.
  const { data: clinicians } = await supabase
    .from('clinic_memberships')
    .select('user_id')
    .eq('clinic_id', profile.clinicId)
    .in('role', ['clinician', 'owner']);

  if (!clinicians || clinicians.length === 0) return [];
  const clinicianIds = clinicians.map((c: any) => c.user_id);

  // 4. Fetch Existing Appointments for these clinicians on this day
  const { data: appointments } = await supabase
    .from('appointments')
    .select('start_time, end_time, clinician_id')
    .eq('clinic_id', profile.clinicId)
    .in('clinician_id', clinicianIds)
    .neq('status', 'cancelled')
    .neq('status', 'no_show')
    .gte('end_time', startOfDay.toISOString())
    .lte('start_time', endOfDay.toISOString());

  // 5. Generate Slots
  const slots: AvailabilitySlot[] = [];
  let current = new Date(startOfDay);

  while (current.getTime() + duration * 60000 <= endOfDay.getTime()) {
    const slotStart = new Date(current);
    const slotEnd = new Date(current.getTime() + duration * 60000);
    
    // Check if AT LEAST ONE clinician is free
    const freeClinician = clinicianIds.find((cId: string) => {
      // Find overlap for this specific clinician
      const hasOverlap = appointments?.some((app: any) => {
        if (app.clinician_id !== cId) return false;
        const appStart = new Date(app.start_time);
        const appEnd = new Date(app.end_time);
        
        // Overlap logic: (StartA < EndB) and (EndA > StartB)
        return slotStart < appEnd && slotEnd > appStart;
      });
      return !hasOverlap;
    });

    if (freeClinician) {
      slots.push({
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString(),
        available: true
      });
    }

    // Increment by 30 mins or duration? Usually 30 mins intervals for flexibility
    // Let's use 30 min steps, but if duration is e.g. 15, use 15.
    const step = Math.min(30, duration); 
    current = new Date(current.getTime() + step * 60000);
  }

  return slots;
}

export async function submitBooking(
  slug: string,
  payload: PublicBookingPayload,
  context: { ip: string; userAgent: string }
): Promise<BookingResult> {
  // 1. Checks
  if (payload.honeypot) return { success: false, message: 'Spam detected' }; // Silent reject?
  
  const supabase = createAdminClient();
  const profile = await getClinicPublicProfile(slug);
  const ipHash = hashIp(context.ip);

  // Rate Limit: 5 per hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('public_booking_requests')
    .select('*', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', oneHourAgo);

  if (count && count >= 5) {
    throw new Error('Too many requests. Please try again later.');
  }

  // 2. Validate Slot & Find Clinician
  // We need to pick a clinician who is actually free at this time.
  const slotStart = new Date(payload.startTime);
  
  const { data: typeData } = await supabase
    .from('appointment_types')
    .select('default_duration_minutes')
    .eq('id', payload.appointmentTypeId)
    .single();
  const duration = typeData?.default_duration_minutes || 30;
  const slotEnd = new Date(slotStart.getTime() + duration * 60000);

  // Fetch clinicians again
  const { data: clinicians } = await supabase
    .from('clinic_memberships')
    .select('user_id')
    .eq('clinic_id', profile.clinicId)
    .in('role', ['clinician', 'owner']);
  const clinicianIds = (clinicians || []).map((c: any) => c.user_id);

  // Fetch busy clinicians
  const { data: busy } = await supabase
    .from('appointments')
    .select('clinician_id')
    .eq('clinic_id', profile.clinicId)
    .in('clinician_id', clinicianIds)
    .neq('status', 'cancelled')
    .neq('status', 'no_show')
    .lt('start_time', slotEnd.toISOString())
    .gt('end_time', slotStart.toISOString()); // Overlap

  const busyIds = new Set(busy?.map((b: any) => b.clinician_id));
  const freeClinicianId = clinicianIds.find((id: string) => !busyIds.has(id));

  if (!freeClinicianId) {
    throw new Error('Selected slot is no longer available.');
  }

  // 3. Log Request (Pending)
  const { data: req, error: reqError } = await supabase
    .from('public_booking_requests')
    .insert({
      clinic_id: profile.clinicId,
      requested_start_time: slotStart.toISOString(),
      requested_end_time: slotEnd.toISOString(),
      appointment_type_id: payload.appointmentTypeId,
      clinician_id: freeClinicianId,
      patient_first_name: payload.patient.firstName,
      patient_last_name: payload.patient.lastName,
      patient_cell_number: payload.patient.cellNumber,
      patient_email: payload.patient.email,
      patient_id_or_passport: payload.patient.idOrPassport,
      notes: payload.notes,
      ip_hash: ipHash,
      user_agent: context.userAgent,
      status: 'submitted'
    })
    .select()
    .single();

  if (reqError) throw new Error(reqError.message);

  // 4. Create/Match Patient
  // Match by Cell Number
  let patientId = null;
  const { data: existingPatient } = await supabase
    .from('patients')
    .select('id')
    .eq('clinic_id', profile.clinicId)
    .eq('cell_number', payload.patient.cellNumber)
    .maybeSingle();

  if (existingPatient) {
    patientId = existingPatient.id;
  } else {
    // Create new
    const { data: newPatient } = await supabase
      .from('patients')
      .insert({
        clinic_id: profile.clinicId,
        first_name: payload.patient.firstName,
        last_name: payload.patient.lastName,
        cell_number: payload.patient.cellNumber,
        email: payload.patient.email,
        id_number: payload.patient.idOrPassport,
        // System user or null for created_by? 
        // We can use a known system ID or leave it if RLS allows (admin client bypasses RLS)
        // But patient schema says created_by is uuid. We might need the clinic owner's ID or similar.
        // For now, let's grab the freeClinicianId as "creator" or any admin.
        created_by: freeClinicianId 
      })
      .select()
      .single();
    if (newPatient) patientId = newPatient.id;
  }

  if (!patientId) throw new Error('Failed to process patient record');

  // 5. Create Appointment
  const { data: appt, error: apptError } = await supabase
    .from('appointments')
    .insert({
      clinic_id: profile.clinicId,
      patient_id: patientId,
      clinician_id: freeClinicianId,
      appointment_type_id: payload.appointmentTypeId,
      start_time: slotStart.toISOString(),
      end_time: slotEnd.toISOString(),
      internal_note: `Public Booking Request (${req.id})\nNote: ${payload.notes || ''}`,
      status: 'booked', // Or 'queued' if approval needed
      created_by: freeClinicianId // Attributed to system actor
    })
    .select()
    .single();

  if (apptError) {
    // If overlap happened race condition
    if (apptError.code === '23P01') throw new Error('Slot taken just now. Please try another.');
    throw new Error(apptError.message);
  }

  // 6. Update Request & Notify
  await supabase
    .from('public_booking_requests')
    .update({
      status: 'accepted',
      processed_at: new Date().toISOString(),
      created_patient_id: patientId,
      created_appointment_id: appt.id
    })
    .eq('id', req.id);

  // Notify Staff (Module 7)
  // We insert into staff_notifications
  await supabase.from('staff_notifications').insert({
    clinic_id: profile.clinicId,
    user_id: freeClinicianId, // Notify the assignee
    title: 'New Online Booking',
    body: `${payload.patient.firstName} booked for ${new Date(slotStart).toLocaleString()}`,
    link_url: `/appointments/${appt.id}`
  });

  return { success: true, appointmentId: appt.id };
}
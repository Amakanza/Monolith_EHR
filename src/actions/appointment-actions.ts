
'use server';

import { getActiveClinic } from '@/lib/server/clinic/get-active-clinic';
import { createAppointment } from '@/lib/server/services/appointment-service';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const schema = z.object({
  patientId: z.string().uuid(),
  startTime: z.string().datetime({ offset: true }), // Expect ISO with offset
  endTime: z.string().datetime({ offset: true }),
  notes: z.string().optional(),
});

export async function createAppointmentAction(formData: FormData) {
  const { clinicId } = await getActiveClinic();
  
  // Transform date-local inputs to ISO for DB
  const rawData = {
    patientId: formData.get('patientId'),
    startTime: new Date(formData.get('startTime') as string).toISOString(),
    endTime: new Date(formData.get('endTime') as string).toISOString(),
    notes: formData.get('notes'),
  };

  const parsed = schema.safeParse(rawData);
  if (!parsed.success) {
    return { error: 'Invalid appointment data' };
  }

  try {
    await createAppointment(clinicId, parsed.data);
  } catch (e: any) {
    return { error: e.message };
  }

  redirect('/app/appointments');
}

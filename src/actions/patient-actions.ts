
'use server';

import { getActiveClinic } from '@/lib/server/clinic/get-active-clinic.ts';
import { createPatient } from '@/lib/server/services/patient-service';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  dob: z.string().optional().or(z.literal('')),
});

export async function createPatientAction(formData: FormData) {
  const { clinicId } = await getActiveClinic();
  const data = Object.fromEntries(formData);
  
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return { error: 'Invalid patient data' };
  }

  try {
    await createPatient(clinicId, parsed.data);
  } catch (e: any) {
    return { error: e.message };
  }

  redirect('/app/patients');
}

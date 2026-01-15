'use server';

import { createClinicService } from '@/lib/server/services/clinic-service';
import { requireUser } from '@/lib/server/auth/require-user';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const createClinicSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
});

export async function createClinicAction(formData: FormData) {
  console.log('Clinic action called with formData:', Object.fromEntries(formData));
  
  const user = await requireUser();
  console.log('User authenticated:', user.id, user.email);
  
  const data = Object.fromEntries(formData);
  
  const parsed = createClinicSchema.safeParse(data);
  if (!parsed.success) {
    console.error('Validation failed:', parsed.error);
    // Return first error message
    return { error: parsed.error.issues[0].message };
  }

  console.log('Validated data:', parsed.data);

  try {
    const result = await createClinicService(user.id, parsed.data.name);
    console.log('Clinic service completed:', result);
  } catch (e: any) {
    console.error('Clinic creation failed:', e);
    if (e.code === '23505') { // Unique violation for slug
      return { error: 'This URL identifier is already taken.' };
    }
    return { error: e.message };
  }

  console.log('Redirecting to /account');
  redirect('/account');
}
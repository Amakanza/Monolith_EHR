'use server';

import { createClinicService } from '@/lib/server/services/clinic-service';
import { requireUser } from '@/lib/server/auth/require-user';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const createClinicSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
});

export async function createClinicAction(formData: FormData) {
  const user = await requireUser();
  const data = Object.fromEntries(formData);
  
  const parsed = createClinicSchema.safeParse(data);
  if (!parsed.success) {
    // Return first error message
    return { error: parsed.error.issues[0].message };
  }

  try {
    await createClinicService(user.id, parsed.data.name);
  } catch (e: any) {
    if (e.code === '23505') { // Unique violation for slug
      return { error: 'This URL identifier is already taken.' };
    }
    return { error: e.message };
  }

  redirect('/account');
}
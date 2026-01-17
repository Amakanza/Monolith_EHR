'use server';

import { redirect } from 'next/navigation';
import { createClinic } from '@/lib/services/clinicService';
import { ensureAuthenticatedServer } from '@/lib/services/authService';

export async function createClinicAction(formData: FormData) {
  try {
    const user = await ensureAuthenticatedServer();
    
    const name = formData.get('name') as string;
    if (!name) {
      return { error: 'Clinic name is required' };
    }

    const timezone = formData.get('timezone') as string || 'Africa/Windhoek';
    
    await createClinic({ name, timezone });
    
    // Redirect to clinics page after successful creation
    redirect('/clinics');
  } catch (error: any) {
    console.error('createClinicAction error:', error);
    return { error: error.message || 'Failed to create clinic' };
  }
}
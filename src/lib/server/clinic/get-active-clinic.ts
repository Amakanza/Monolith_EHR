
import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '../auth/require-user';
import { redirect } from 'next/navigation';

export async function getActiveClinic() {
  const user = await requireUser();
  const supabase = createClient();

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('active_clinic_id')
    .eq('id', user.id)
    .single();

  if (!profile?.active_clinic_id) {
    redirect('/app/onboarding');
  }

  return { 
    user, 
    clinicId: profile.active_clinic_id as string 
  };
}

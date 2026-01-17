import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server'

export async function getActiveClinic() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  const { data } = await supabase
    .from('user_profiles')
    .select('active_clinic_id')
    .eq('id', user.id)
    .single();
    
  return data?.active_clinic_id || null;
}

export async function requireClinic() {
  const activeClinicId = await getActiveClinic();
  
  if (!activeClinicId) {
    redirect('/app/onboarding');
  }

  return activeClinicId;
}
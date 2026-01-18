import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server'

export async function getActiveClinic() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  // Note: Direct DB field access is acceptable here as this is a low-level helper
  // for getting a specific field value. Prefer using user.activeClinicId from CurrentUser
  // when possible in application code.
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
import 'server-only';
import { getActiveClinic } from './get-active-clinic';
import { createClient } from '@/lib/server/supabase/server';
import { redirect } from 'next/navigation';

export async function requireClinic() {
  const { user, clinicId } = await getActiveClinic();
  const supabase = createClient();

  // 1. Verify Membership
  const { data: membership, error: membershipError } = await supabase
    .from('clinic_memberships')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('user_id', user.id)
    .single();

  if (membershipError || !membership) {
    // User has an active_clinic_id but is not a member (e.g. removed).
    // Redirect to onboarding to pick/create another or handle error.
    redirect('/app/onboarding');
  }

  // 2. Get Clinic Details
  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('*')
    .eq('id', clinicId)
    .single();

  if (clinicError || !clinic) {
    redirect('/app/onboarding');
  }

  return { user, clinic, membership };
}
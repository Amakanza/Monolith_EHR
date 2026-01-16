import 'server-only';
import { createClient } from '@/lib/supabase/server';

export async function createClinicService(userId: string, name: string) {
  const supabase = createClient();
  
  console.log('Creating clinic with userId:', userId, 'name:', name);
  
  // 1. Create Clinic
  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .insert({ name, timezone: 'Africa/Windhoek', created_by: userId })
    .select('id')
    .single();

  console.log('Clinic creation result:', { clinic, error: clinicError });

  if (clinicError) {
    console.error('Clinic creation failed:', clinicError);
    throw clinicError;
  }

  // 2. Add Membership (Owner)
  console.log('Adding membership for clinic:', clinic.id, 'user:', userId);
  const { error: memberError } = await supabase
    .from('clinic_memberships')
    .insert({
      clinic_id: clinic.id,
      user_id: userId,
      role: 'owner'
    });

  console.log('Membership creation result:', { error: memberError });

  if (memberError) {
    console.error('Membership creation failed:', memberError);
    // Cleanup clinic if membership fails (though RLS/transactions should handle this in a real setup)
    await supabase.from('clinics').delete().eq('id', clinic.id);
    throw memberError;
  }

  // 3. Set Active Clinic
  console.log('Setting active clinic:', clinic.id, 'for user:', userId);
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({ active_clinic_id: clinic.id })
    .eq('id', userId);

  console.log('Profile update result:', { error: profileError });

  if (profileError) {
    console.error('Profile update failed:', profileError);
    throw profileError;
  }

  console.log('Clinic service completed successfully, returning clinic:', clinic);
  return clinic;
}

export async function getClinicDetails(clinicId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .eq('id', clinicId)
    .single();
    
  if (error) throw error;
  return data;
}
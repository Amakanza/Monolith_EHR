import { createClient } from '@/lib/supabase/server';
import { Clinic, ClinicMemberProfile, ClinicRole } from '@/lib/types/clinics';

function mapClinic(row: any): Clinic {
  return {
    id: row.id,
    name: row.name,
    timezone: row.timezone,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

export async function createClinic(input: { name: string; timezone?: string }): Promise<{ clinic: Clinic }> {
  const supabase = createClient();
  
  // Use the RPC function for transactional creation (clinic + owner membership)
  const { data, error } = await supabase.rpc('create_clinic_with_owner', {
    name: input.name,
    timezone: input.timezone || 'Africa/Windhoek'
  });

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Failed to create clinic');

  return { clinic: mapClinic(data) };
}

export async function listMyClinics(): Promise<{ clinics: Clinic[] }> {
  console.log('listMyClinics called');
  const supabase = createClient();
  
  // Check auth first
  const { data: { user } } = await supabase.auth.getUser();
  console.log('listMyClinics auth user:', user);
  
  if (!user) {
    console.error('User not authenticated in listMyClinics');
    throw new Error('Not authenticated');
  }

  // Explicit JOIN with clinic_memberships to bypass RLS timing issues
  const { data, error } = await supabase
    .from('clinics')
    .select(`
      *,
      clinic_memberships!inner(
        user_id,
        role
      )
    `)
    .eq('clinic_memberships.user_id', user.id)
    .order('clinics.created_at', { ascending: false });

  console.log('listMyClinics query result:', { data, error });

  if (error) {
    console.error('listMyClinics error:', error);
    
    // Provide more specific error messages
    if (error.code === 'PGRST116') {
      throw new Error('Invalid query format in clinics listing');
    } else if (error.code === '42501') {
      throw new Error('Permission denied accessing clinics');
    } else {
      throw new Error(`Failed to fetch clinics: ${error.message}`);
    }
  }
  
  const result = { clinics: data.map(mapClinic) };
  console.log('listMyClinics returning:', result);
  return result;
}

export async function getClinicById(clinicId: string): Promise<{ clinic: Clinic; myRole: ClinicRole }> {
  console.log('getClinicById called with clinicId:', clinicId);
  const supabase = createClient();
  
  // Check auth first
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Auth user:', user);
  if (!user) {
    console.error('Not authenticated');
    throw new Error('Not authenticated');
  }

  // 1. Fetch Clinic with explicit JOIN to clinic_memberships
  console.log('Fetching clinic with user_id:', user.id);
  const { data: clinicData, error: clinicError } = await supabase
    .from('clinics')
    .select(`
      *,
      clinic_memberships!inner(
        user_id,
        role
      )
    `)
    .eq('id', clinicId)
    .eq('clinic_memberships.user_id', user.id)
    .single();

  console.log('Clinic query result:', { clinicData, error: clinicError });

  if (clinicError || !clinicData) {
    console.error('Clinic not found or access denied:', clinicError);
    
    // Provide specific error messages
    if (clinicError?.code === 'PGRST116') {
      throw new Error('Invalid clinic ID format');
    } else if (clinicError?.code === '42501') {
      throw new Error('Permission denied: You do not have access to this clinic');
    } else if (clinicError?.code === 'PGRST116') {
      throw new Error('Clinic not found');
    } else {
      throw new Error('Clinic not found or access denied');
    }
  }

  // Extract role from the joined data
  const role = (clinicData as any).clinic_memberships?.role;
  
  // Clean up the clinic data for mapping
  const { clinic_memberships, ...cleanClinicData } = clinicData as any;

  const result = { 
    clinic: mapClinic(cleanClinicData),
    myRole: role as ClinicRole
  };
  
  console.log('getClinicById returning:', result);
  return result;
}

export async function setActiveClinic(clinicId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Verify membership before setting
  const { data: memberData } = await supabase
    .from('clinic_memberships')
    .select('id')
    .eq('clinic_id', clinicId)
    .eq('user_id', user.id)
    .single();

  if (!memberData) throw new Error('You are not a member of this clinic');

  const { error } = await supabase
    .from('user_profiles')
    .update({ active_clinic_id: clinicId })
    .eq('id', user.id);

  if (error) throw new Error(error.message);
}

export async function getActiveClinic(): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('user_profiles')
    .select('active_clinic_id')
    .eq('id', user.id)
    .single();
    
  return data?.active_clinic_id ?? null;
}

// --- Membership Management ---

export async function listClinicMembers(clinicId: string): Promise<{ members: ClinicMemberProfile[] }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('clinic_memberships')
    .select(`
      id,
      role,
      user_id,
      user_profiles (
        full_name,
        global_role
      )
    `)
    .eq('clinic_id', clinicId);

  if (error) throw new Error(error.message);

  // Note: We can't easily join auth.users to get email due to permissions.
  // We'll rely on full_name for now. In a real app, you might sync email to public.user_profiles
  // or use a secure edge function to fetch emails.
  
  return {
    members: data.map((row: any) => ({
      membershipId: row.id,
      userId: row.user_id,
      role: row.role as ClinicRole,
      fullName: row.user_profiles?.full_name || 'Unknown',
    }))
  };
}

export async function addClinicMember(input: { clinicId: string; userId: string; role: ClinicRole }): Promise<void> {
  const supabase = createClient();
  
  // Note: Ensure the caller is admin/owner via RLS/Policy, but service methods usually imply trusted context?
  // No, Supabase RLS is the ultimate guard. We just attempt the insert.
  
  const { error } = await supabase
    .from('clinic_memberships')
    .insert({
      clinic_id: input.clinicId,
      user_id: input.userId,
      role: input.role
    });

  if (error) {
    if (error.code === '23505') throw new Error('User is already a member');
    throw new Error(error.message);
  }
}

export async function updateClinicMemberRole(input: { clinicId: string; userId: string; role: ClinicRole }): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('clinic_memberships')
    .update({ role: input.role })
    .eq('clinic_id', input.clinicId)
    .eq('user_id', input.userId);

  if (error) throw new Error(error.message);
}

export async function removeClinicMember(input: { clinicId: string; userId: string }): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('clinic_memberships')
    .delete()
    .eq('clinic_id', input.clinicId)
    .eq('user_id', input.userId);

  if (error) throw new Error(error.message);
}

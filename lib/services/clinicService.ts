import { createClient } from '@/lib/server/supabase/server';
import { Clinic, ClinicRole } from '@/lib/types/clinics';
import { dbToAppProfile } from '@/lib/mappers/userProfile';

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

/**
 * Creates a new clinic with the current user as owner
 * Calls the RPC and treats return value strictly as a UUID
 */
export async function createClinic(input: { name: string; timezone?: string }): Promise<string> {
  console.log('createClinic called with:', { name: input.name, timezone: input.timezone });
  
  const supabase = createClient();
  
  // Call the RPC function for transactional creation (clinic + owner membership + active clinic)
  const { data, error } = await supabase.rpc('create_clinic_with_owner', {
    name: input.name,
    timezone: input.timezone || 'Africa/Windhoek'
  });

  console.log('RPC create_clinic_with_owner result:', { data, error });

  if (error) {
    console.error('RPC error:', error);
    throw new Error(error.message);
  }
  
  if (!data) {
    console.error('RPC returned falsy value:', data);
    throw new Error('Failed to create clinic: RPC returned no data');
  }

  // Treat the return value strictly as a UUID
  const clinicId = data as string;
  console.log('Clinic created successfully with ID:', clinicId);
  
  return clinicId;
}

/**
 * Lists clinics that the current user belongs to with role information
 * Uses the new list_my_clinics() RPC function for better performance and RLS safety
 */
export async function listMyClinics(): Promise<{ clinics: Clinic[] }> {
  console.log('listMyClinics called');
  const supabase = createClient();
  
  // Use the new RPC function that includes role information
  const { data, error } = await supabase.rpc('list_my_clinics');

  console.log('listMyClinics RPC result:', { data, error, count: data?.length });

  if (error) {
    console.error('listMyClinics RPC error:', error);
    throw new Error(`Failed to fetch clinics: ${error.message}`);
  }
  
  if (!data) {
    console.log('listMyClinics: No data returned');
    return { clinics: [] };
  }
  
  // Map the results, include role if needed for UI
  const clinics = data.map((row: any) => {
    const clinic = mapClinic(row);
    // Store role if needed for UI
    (clinic as any).myRole = row.my_role;
    return clinic;
  });
  
  const result = { clinics };
  console.log('listMyClinics returning:', result);
  return result;
}

/**
 * Gets a specific clinic by ID that the user belongs to
 */
export async function getClinicById(clinicId: string): Promise<{ clinic: Clinic; myRole: ClinicRole }> {
  console.log('getClinicById called with clinicId:', clinicId);
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('Not authenticated');
    throw new Error('Not authenticated');
  }
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
    throw new Error('Clinic not found or access denied');
  }

  const role = (clinicData as any).clinic_memberships?.role;
  const { clinic_memberships, ...cleanClinicData } = clinicData as any;

  const result = { 
    clinic: mapClinic(cleanClinicData),
    myRole: role as ClinicRole
  };
  
  console.log('getClinicById returning:', result);
  return result;
}

/**
 * Sets the active clinic for the current user
 * Uses the new set_active_clinic RPC function
 */
export async function setActiveClinic(clinicId: string): Promise<void> {
  console.log('setActiveClinic called with:', clinicId);
  const supabase = createClient();
  
  // Use the new RPC function that handles validation
  const { error } = await supabase.rpc('set_active_clinic', {
    _clinic_id: clinicId
  });

  if (error) {
    console.error('setActiveClinic RPC error:', error);
    throw new Error(error.message);
  }
  
  console.log('setActiveClinic success');
}

/**
 * Gets the current active clinic for the user
 */
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

/**
 * Lists all members of a clinic
 */
export async function listClinicMembers(clinicId: string) {
  console.log('listClinicMembers called for clinic:', clinicId);
  const supabase = createClient();

  const { data, error } = await supabase
    .from('clinic_memberships')
    .select(`
      id,
      role,
      user_id,
      user_profiles!inner (*)
    `)
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: true });

  console.log('listClinicMembers query result:', { data, error });

  if (error) {
    console.error('listClinicMembers error:', error);
    throw new Error(error.message);
  }
  
  const result = {
    members: data.map((row: any) => {
      // Use centralized mapper for user profile fields
      const userProfile = row.user_profiles ? dbToAppProfile(row.user_profiles) : null;
      
      return {
        membershipId: row.id,
        userId: row.user_id,
        role: row.role as ClinicRole,
        fullName: userProfile?.fullName || 'Unknown User',
        email: null, // Email is in auth.users, not user_profiles table. Would need separate query if needed.
        globalRole: userProfile?.globalRole || 'standard_user',
      };
    })
  };

  console.log('listClinicMembers returning:', result);
  return result;
}

/**
 * Adds a member to a clinic
 * Uses the new add_clinic_member RPC function
 */
export async function addClinicMember(input: { clinicId: string; userId: string; role: ClinicRole }): Promise<void> {
  console.log('addClinicMember called with:', input);
  const supabase = createClient();
  
  const { error } = await supabase.rpc('add_clinic_member', {
    _clinic_id: input.clinicId,
    _user_id: input.userId,
    _role: input.role
  });

  if (error) {
    console.error('addClinicMember RPC error:', error);
    if (error.message.includes('duplicate')) {
      throw new Error('User is already a member');
    }
    throw new Error(error.message);
  }
  
  console.log('addClinicMember success');
}

/**
 * Updates a clinic member's role
 * Uses the new update_clinic_member_role RPC function
 */
export async function updateClinicMemberRole(input: { clinicId: string; userId: string; role: ClinicRole }): Promise<void> {
  console.log('updateClinicMemberRole called with:', input);
  const supabase = createClient();

  const { error } = await supabase.rpc('update_clinic_member_role', {
    _clinic_id: input.clinicId,
    _user_id: input.userId,
    _new_role: input.role
  });

  if (error) {
    console.error('updateClinicMemberRole RPC error:', error);
    throw new Error(error.message);
  }
  
  console.log('updateClinicMemberRole success');
}

/**
 * Removes a member from a clinic
 * Uses the new remove_clinic_member RPC function
 */
export async function removeClinicMember(input: { clinicId: string; userId: string }): Promise<void> {
  console.log('removeClinicMember called with:', input);
  const supabase = createClient();

  const { error } = await supabase.rpc('remove_clinic_member', {
    _clinic_id: input.clinicId,
    _user_id: input.userId
  });

  if (error) {
    console.error('removeClinicMember RPC error:', error);
    throw new Error(error.message);
  }
  
  console.log('removeClinicMember success');
}
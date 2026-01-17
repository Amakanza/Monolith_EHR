import { createClient } from '@/lib/supabase/server';
import { Clinic, ClinicRole } from '@/lib/types/clinics';

function mapClinic(row: any): Clinic {
  return {
    id: row.id,
    name: row.name,
    timezone: row.timezone,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    slug: row.slug,
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
 * Lists clinics that the current user belongs to
 * Uses the exact query specified in requirements:
 * select clinics.*
 * from clinics
 * join clinic_memberships on clinic_memberships.clinic_id = clinics.id
 * where clinic_memberships.user_id = auth.uid()
 */
export async function listMyClinics(): Promise<{ clinics: Clinic[] }> {
  console.log('listMyClinics called');
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  console.log('listMyClinics auth user:', user);
  
  if (!user) {
    console.error('User not authenticated in listMyClinics');
    throw new Error('Not authenticated');
  }

  // Use the exact SQL structure specified in requirements with inner join
  const { data: finalData, error: finalError } = await supabase
    .from('clinics')
    .select(`
      id,
      name,
      timezone,
      created_by,
      created_at,
      updated_at,
      archived_at,
      slug,
      clinic_memberships!inner(
        user_id,
        clinic_id
      )
    `)
    .eq('clinic_memberships.user_id', user.id)
    .order('created_at', { ascending: false });

  console.log('listMyClinics clinics query result:', { finalData, finalError, count: finalData?.length });

  if (finalError) {
    console.error('listMyClinics database error:', finalError);
    throw new Error(`Failed to fetch clinics: ${finalError.message}`);
  }
  
  // Map the results, extracting clinic data from the joined structure
  const clinics = finalData.map((row: any) => {
    const { clinic_memberships, ...clinicData } = row;
    return mapClinic(clinicData);
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
 */
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
  
  return {
    members: data.map((row: any) => ({
      membershipId: row.id,
      userId: row.user_id,
      role: row.role as ClinicRole,
      fullName: row.user_profiles?.full_name || 'Unknown',
    }))
  };
}

/**
 * Adds a member to a clinic
 */
export async function addClinicMember(input: { clinicId: string; userId: string; role: ClinicRole }): Promise<void> {
  const supabase = createClient();
  
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

/**
 * Updates a clinic member's role
 */
export async function updateClinicMemberRole(input: { clinicId: string; userId: string; role: ClinicRole }): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('clinic_memberships')
    .update({ role: input.role })
    .eq('clinic_id', input.clinicId)
    .eq('user_id', input.userId);

  if (error) throw new Error(error.message);
}

/**
 * Removes a member from a clinic
 */
export async function removeClinicMember(input: { clinicId: string; userId: string }): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('clinic_memberships')
    .delete()
    .eq('clinic_id', input.clinicId)
    .eq('user_id', input.userId);

  if (error) throw new Error(error.message);
}
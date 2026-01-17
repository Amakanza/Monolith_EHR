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
 * Ensures user has a profile, creates one if missing
 */
async function ensureUserProfile(userId: string): Promise<void> {
  const supabase = createClient();
  
  // Check if profile exists
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', userId)
    .single();
    
  if (profileError && profileError.code === 'PGRST116') {
    // Profile doesn't exist, create it
    console.log('Creating missing user profile for:', userId);
    const { error: createError } = await supabase
      .from('user_profiles')
      .insert({ id: userId });
      
    if (createError) {
      console.error('Failed to create user profile:', createError);
      throw new Error('Failed to create user profile');
    }
  } else if (profileError) {
    console.error('Error checking user profile:', profileError);
    throw new Error('Error checking user profile');
  }
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
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('listMyClinics auth check:', { user, authError });
  
  if (authError) {
    console.error('Authentication error in listMyClinics:', authError);
    throw new Error(`Authentication failed: ${authError.message}`);
  }
  
  if (!user) {
    console.error('User not authenticated in listMyClinics');
    throw new Error('Not authenticated: No user found');
  }
  
  // Ensure user has a profile (create if missing)
  try {
    await ensureUserProfile(user.id);
  } catch (error) {
    console.error('Failed to ensure user profile:', error);
    // Continue anyway - the trigger might create the profile
  }
  
  // Check if user has a profile (now should exist)
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, active_clinic_id, full_name')
    .eq('id', user.id)
    .single();
  
  console.log('listMyClinics user profile check:', { profile, profileError });
  
  if (profileError) {
    console.error('User profile error in listMyClinics:', profileError);
    if (profileError.code === 'PGRST116') {
      throw new Error('User profile not found. Please try refreshing the page or contact support.');
    }
    throw new Error(`Profile error: ${profileError.message}`);
  }
  
  // If user has a profile but no active clinic, that's okay - they might need to create or join one
  if (profile && !profile.active_clinic_id) {
    console.log('User has profile but no active clinic set');
  }

  // First, let's check if the user has any clinic memberships at all
  const { data: membershipsData, error: membershipsError } = await supabase
    .from('clinic_memberships')
    .select('clinic_id, role')
    .eq('user_id', user.id);
    
  console.log('listMyClinics memberships check:', { membershipsData, membershipsError });
  
  if (membershipsError) {
    console.error('Membership check error:', membershipsError);
    throw new Error(`Error checking clinic memberships: ${membershipsError.message}`);
  }
  
  if (!membershipsData || membershipsData.length === 0) {
    console.log('User has no clinic memberships');
    return { clinics: [] }; // Return empty array instead of error
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
    
    // Provide more specific error messages based on the error type
    if (finalError.code === 'PGRST301') {
      throw new Error('Access denied: You do not have permission to view clinics');
    }
    if (finalError.code === 'PGRST116') {
      throw new Error('Clinics not found. You may need to join or create a clinic first.');
    }
    
    throw new Error(`Database error: ${finalError.message}`);
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

/**
 * Finds a user by email address
 */
export async function findUserByEmail(email: string): Promise<{ id: string; fullName: string | null } | null> {
  const supabase = createClient();
  
  // First try to find user in auth.users via admin API
  const { data: { users }, error: adminError } = await supabase.auth.admin.listUsers();
  
  if (adminError) {
    console.error('Admin API error:', adminError);
    throw new Error('Failed to search for user');
  }
  
  const user = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    return null;
  }
  
  // Get user profile information
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();
    
  if (profileError && profileError.code !== 'PGRST116') {
    console.error('Profile fetch error:', profileError);
  }
  
  return {
    id: user.id,
    fullName: profile?.full_name || null
  };
}

/**
 * Adds a member to a clinic by email or user ID
 * This is the missing function that was identified in the audit
 */
export async function addMemberByEmailOrUserId(
  clinicId: string, 
  identifier: string, 
  role: ClinicRole
): Promise<{ userId: string; fullName: string | null }> {
  console.log('addMemberByEmailOrUserId called:', { clinicId, identifier, role });
  
  const supabase = createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }
  
  // Check if current user has permission to add members (owner/admin)
  const { data: currentUserMembership, error: permissionError } = await supabase
    .from('clinic_memberships')
    .select('role')
    .eq('clinic_id', clinicId)
    .eq('user_id', user.id)
    .single();
    
  if (permissionError || !currentUserMembership) {
    throw new Error('You are not a member of this clinic');
  }
  
  if (!['owner', 'admin'].includes(currentUserMembership.role)) {
    throw new Error('Only clinic owners and admins can add members');
  }
  
  // Determine if identifier is email or user ID
  let targetUserId: string;
  let userInfo: { id: string; fullName: string | null } | null = null;
  
  // Check if it looks like a UUID (simple validation)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (uuidRegex.test(identifier)) {
    // It's a user ID
    targetUserId = identifier;
    
    // Verify user exists and get profile info
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', targetUserId)
      .single();
      
    if (profileError) {
      if (profileError.code === 'PGRST116') {
        throw new Error('User not found');
      }
      throw new Error('Failed to verify user');
    }
    
    userInfo = { id: targetUserId, fullName: profile.full_name };
  } else {
    // It's an email address
    userInfo = await findUserByEmail(identifier);
    
    if (!userInfo) {
      throw new Error('No user found with this email address');
    }
    
    targetUserId = userInfo.id;
  }
  
  // Check if user is already a member
  const { data: existingMembership, error: checkError } = await supabase
    .from('clinic_memberships')
    .select('id, role')
    .eq('clinic_id', clinicId)
    .eq('user_id', targetUserId)
    .single();
    
  if (checkError && checkError.code !== 'PGRST116') {
    throw new Error('Failed to check existing membership');
  }
  
  if (existingMembership) {
    throw new Error(`User is already a member of this clinic as ${existingMembership.role}`);
  }
  
  // Add the member
  const { error: addError } = await supabase
    .from('clinic_memberships')
    .insert({
      clinic_id: clinicId,
      user_id: targetUserId,
      role: role
    });
    
  if (addError) {
    console.error('Error adding member:', addError);
    throw new Error(`Failed to add member: ${addError.message}`);
  }
  
  console.log('Member added successfully:', { userId: targetUserId, role });
  
  return { userId: userInfo!.id, fullName: userInfo!.fullName };
}
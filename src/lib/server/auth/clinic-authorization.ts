import { createClient } from '@/lib/supabase/server';
import { ClinicRole } from '@/lib/types/clinics';

/**
 * Checks if the current user has the required role in a clinic
 * @param clinicId The clinic ID to check
 * @param requiredRoles Array of roles that are allowed
 * @returns The user's current role in the clinic
 * @throws Error if user is not authenticated, not a member, or doesn't have required role
 */
export async function requireClinicRole(
  clinicId: string, 
  requiredRoles: ClinicRole[] = ['owner', 'admin', 'clinician', 'receptionist']
): Promise<ClinicRole> {
  const supabase = createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }
  
  // Check user membership and role
  const { data: membership, error: membershipError } = await supabase
    .from('clinic_memberships')
    .select('role')
    .eq('clinic_id', clinicId)
    .eq('user_id', user.id)
    .single();
    
  if (membershipError) {
    if (membershipError.code === 'PGRST116') {
      throw new Error('You are not a member of this clinic');
    }
    throw new Error('Failed to verify clinic membership');
  }
  
  const userRole = membership.role as ClinicRole;
  
  // Check if user has required role
  if (!requiredRoles.includes(userRole)) {
    throw new Error(`Access denied. Required role: ${requiredRoles.join(' or ')}. Your role: ${userRole}`);
  }
  
  return userRole;
}

/**
 * Checks if the current user is an admin (owner or admin) in a clinic
 * @param clinicId The clinic ID to check
 * @returns The user's current role in the clinic
 * @throws Error if user is not authenticated, not a member, or not an admin
 */
export async function requireClinicAdmin(clinicId: string): Promise<ClinicRole> {
  return requireClinicRole(clinicId, ['owner', 'admin']);
}

/**
 * Checks if the current user is the owner of a clinic
 * @param clinicId The clinic ID to check
 * @returns The user's current role in the clinic
 * @throws Error if user is not authenticated, not a member, or not the owner
 */
export async function requireClinicOwner(clinicId: string): Promise<ClinicRole> {
  return requireClinicRole(clinicId, ['owner']);
}

/**
 * Gets the current user's role in a clinic without throwing errors
 * @param clinicId The clinic ID to check
 * @returns The user's role or null if not a member
 */
export async function getUserClinicRole(clinicId: string): Promise<ClinicRole | null> {
  try {
    return await requireClinicRole(clinicId);
  } catch (error) {
    return null;
  }
}
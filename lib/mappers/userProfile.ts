import { AppUserProfile, GlobalRole } from '@/lib/types/auth';

/**
 * Maps database user_profiles row to application UserProfile type
 */
export function dbToAppProfile(dbProfile: any): AppUserProfile {
  if (!dbProfile) {
    return {
      id: '',
      fullName: null,
      globalRole: 'standard_user' as GlobalRole,
      avatarUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activeClinicId: null,
    };
  }

  return {
    id: dbProfile.id,
    fullName: dbProfile.full_name || null,
    globalRole: (dbProfile.global_role as GlobalRole) || 'standard_user',
    avatarUrl: dbProfile.avatar_url || null,
    createdAt: dbProfile.created_at,
    updatedAt: dbProfile.updated_at,
    activeClinicId: dbProfile.active_clinic_id || null,
  };
}

/**
 * Maps application UserProfile updates to database column names
 */
export function appToDbProfile(appProfile: Partial<AppUserProfile>): Record<string, any> {
  const dbProfile: Record<string, any> = {};

  if (appProfile.fullName !== undefined) {
    dbProfile.full_name = appProfile.fullName;
  }
  if (appProfile.globalRole !== undefined) {
    dbProfile.global_role = appProfile.globalRole;
  }
  if (appProfile.avatarUrl !== undefined) {
    dbProfile.avatar_url = appProfile.avatarUrl;
  }
  if (appProfile.activeClinicId !== undefined) {
    dbProfile.active_clinic_id = appProfile.activeClinicId;
  }
  if (appProfile.updatedAt !== undefined) {
    dbProfile.updated_at = appProfile.updatedAt;
  }

  return dbProfile;
}

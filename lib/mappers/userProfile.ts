import { DBUserProfile, AppUserProfile, GlobalRole } from '../types/auth';

/**
 * Maps database user profile (snake_case) to application user profile (camelCase)
 * This is the SINGLE source of truth for field mapping - do not duplicate mapping logic elsewhere!
 */
export function dbToAppProfile(db: DBUserProfile): AppUserProfile {
  return {
    id: db.id,
    fullName: db.full_name,
    globalRole: (db.global_role as GlobalRole) ?? 'standard_user',
    avatarUrl: db.avatar_url ?? null,
    createdAt: db.created_at,
    updatedAt: db.updated_at ?? db.created_at,
    activeClinicId: db.active_clinic_id ?? null,
  };
}

/**
 * Maps application user profile (camelCase) to database user profile (snake_case)
 * Use this for updates/inserts to the database
 */
export function appToDbProfile(app: Partial<AppUserProfile>): Partial<DBUserProfile> {
  const db: Partial<DBUserProfile> = {};
  
  if (app.fullName !== undefined) db.full_name = app.fullName;
  if (app.globalRole !== undefined) db.global_role = app.globalRole;
  if (app.avatarUrl !== undefined) db.avatar_url = app.avatarUrl;
  if (app.activeClinicId !== undefined) db.active_clinic_id = app.activeClinicId;
  if (app.updatedAt !== undefined) db.updated_at = app.updatedAt;
  
  return db;
}

/**
 * Type guard to ensure we're working with AppUserProfile, not DBUserProfile
 * Use this in development to catch accidental DB field usage
 */
export function assertAppProfile(obj: any): asserts obj is AppUserProfile {
  if (!obj || typeof obj !== 'object') {
    throw new Error('Expected AppUserProfile object');
  }
  
  // Check for common DB snake_case fields that shouldn't exist
  const dbFields = ['full_name', 'global_role', 'avatar_url', 'created_at', 'updated_at', 'active_clinic_id'];
  const hasDbFields = dbFields.some(field => field in obj);
  
  if (hasDbFields) {
    const foundDbFields = dbFields.filter(field => field in obj);
    throw new Error(`DB field(s) detected in AppUserProfile: ${foundDbFields.join(', ')}. Use dbToAppProfile() mapper first.`);
  }
  
  // Check for required camelCase fields
  const requiredFields = ['id', 'fullName', 'globalRole', 'avatarUrl', 'createdAt', 'updatedAt'];
  const missingFields = requiredFields.filter(field => !(field in obj));
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required AppUserProfile fields: ${missingFields.join(', ')}`);
  }
}
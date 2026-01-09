// Represents role of a user across the system
export type GlobalRole = 'super_admin' | 'standard_user';

// Database representation of user profile (snake_case fields returned from Supabase)
export interface DBUserProfile {
  id: string;
  full_name: string | null;
  global_role?: GlobalRole | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at?: string;
  active_clinic_id?: string | null;
}

// Represents the user profile in application/domain shape (camelCase)
export interface UserProfile {
  id: string;
  fullName: string | null;
  globalRole: GlobalRole;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  activeClinicId?: string | null;
}

// Represents the currently authenticated user including profile + global role
export interface CurrentUser {
  id: string;
  email: string;
  fullName: string | null;
  globalRole: GlobalRole;
  avatarUrl: string | null;
  activeClinicId?: string | null;
}

export interface AuthError {
  message: string;
  code?: string;
}

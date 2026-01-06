export type GlobalRole = 'super_admin' | 'standard_user';

export interface UserProfile {
  id: string;
  fullName: string | null;
  globalRole: GlobalRole;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  activeClinicId?: string | null;
}

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

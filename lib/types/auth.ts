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

export type AppUserProfile = UserProfile;

export interface AppMe {
  auth: {
    id: string;
    email: string | null;
  };
  profile: UserProfile;
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

export type ClinicRole = 'owner' | 'admin' | 'clinician' | 'receptionist';

export interface Clinic {
  id: string;
  name: string;
  timezone: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

export interface ClinicMembership {
  id: string;
  clinicId: string;
  userId: string;
  role: ClinicRole;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicMemberProfile {
  userId: string;
  fullName: string | null;
  role: ClinicRole;
  membershipId: string;
  email?: string; // Optional, depending on access level
}

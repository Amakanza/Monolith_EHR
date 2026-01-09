export type Gender = 'male' | 'female' | 'other' | 'unknown';
export type FundingType = 'medical_aid' | 'cash' | 'company' | 'other';

export interface Patient {
  id: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null; // ISO Date string YYYY-MM-DD
  gender: Gender | null;
  idNumber: string | null;
  passportNumber: string | null;
  dependentCode: string | null;
  cellNumber: string | null;
  telNumber: string | null;
  email: string | null;
  postalAddress: string | null;
  addressCity: string | null;
  occupation: string | null;
  fileNumber: string | null;
  archivedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientMembership {
  id: string;
  patientId: string;
  clinicId: string;
  fundingType: FundingType | null;
  medicalAidName: string | null;
  medicalAidPlan: string | null;
  medicalAidNumber: string | null;
  patientIsMainMember: boolean;
  mainMemberFirstName: string | null;
  mainMemberLastName: string | null;
  mainMemberIdNumber: string | null;
  mainMemberPassportNumber: string | null;
  mainMemberCellNumber: string | null;
  mainMemberTelNumber: string | null;
  mainMemberOccupation: string | null;
  mainMemberEmployer: string | null;
  mainMemberEmployerContact: string | null;
  mainMemberPostalAddress: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientWithMembership {
  patient: Patient;
  membership: PatientMembership | null;
}

// Input Types

export interface CreatePatientInput {
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  gender?: Gender | null;
  idNumber?: string | null;
  passportNumber?: string | null;
  dependentCode?: string | null;
  cellNumber?: string | null;
  telNumber?: string | null;
  email?: string | null;
  postalAddress?: string | null;
  addressCity?: string | null;
  occupation?: string | null;
  fileNumber?: string | null;
}

export interface UpdatePatientInput extends Partial<CreatePatientInput> {
  // clinicId cannot be changed
}

export interface UpsertPatientMembershipInput {
  fundingType?: FundingType | null;
  medicalAidName?: string | null;
  medicalAidPlan?: string | null;
  medicalAidNumber?: string | null;
  patientIsMainMember: boolean;
  mainMemberFirstName?: string | null;
  mainMemberLastName?: string | null;
  mainMemberIdNumber?: string | null;
  mainMemberPassportNumber?: string | null;
  mainMemberCellNumber?: string | null;
  mainMemberTelNumber?: string | null;
  mainMemberOccupation?: string | null;
  mainMemberEmployer?: string | null;
  mainMemberEmployerContact?: string | null;
  mainMemberPostalAddress?: string | null;
}

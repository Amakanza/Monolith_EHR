
import { createClient } from '@/lib/supabase/server';
import { 
  CreatePatientInput, 
  Patient, 
  PatientMembership, 
  PatientWithMembership, 
  UpdatePatientInput, 
  UpsertPatientMembershipInput 
} from '@/lib/types/patients';
import { ensureAuthenticatedServer } from '@/lib/services/authService';
import { recordAuditEvent } from '@/lib/services/reportingService';

// --- Mappers ---

function mapPatient(row: any): Patient {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    firstName: row.first_name,
    lastName: row.last_name,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    idNumber: row.id_number,
    passportNumber: row.passport_number,
    dependentCode: row.dependent_code,
    cellNumber: row.cell_number,
    telNumber: row.tel_number,
    email: row.email,
    postalAddress: row.postal_address,
    addressCity: row.address_city,
    occupation: row.occupation,
    fileNumber: row.file_number,
    archivedAt: row.archived_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMembership(row: any): PatientMembership {
  return {
    id: row.id,
    patientId: row.patient_id,
    clinicId: row.clinic_id,
    fundingType: row.funding_type,
    medicalAidName: row.medical_aid_name,
    medicalAidPlan: row.medical_aid_plan,
    medicalAidNumber: row.medical_aid_number,
    patientIsMainMember: row.patient_is_main_member,
    mainMemberFirstName: row.main_member_first_name,
    mainMemberLastName: row.main_member_last_name,
    mainMemberIdNumber: row.main_member_id_number,
    mainMemberPassportNumber: row.main_member_passport_number,
    mainMemberCellNumber: row.main_member_cell_number,
    mainMemberTelNumber: row.main_member_tel_number,
    mainMemberOccupation: row.main_member_occupation,
    mainMemberEmployer: row.main_member_employer,
    mainMemberEmployerContact: row.main_member_employer_contact,
    mainMemberPostalAddress: row.main_member_postal_address,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// --- Helpers ---

function validateMembership(
  input: UpsertPatientMembershipInput, 
  patientDependentCode?: string | null
) {
  if (!input.patientIsMainMember) {
    if (!patientDependentCode) {
      throw new Error('Dependent Code is required when patient is not the main member.');
    }
    
    const required = [
      'mainMemberFirstName',
      'mainMemberLastName',
      'mainMemberPostalAddress',
      'mainMemberEmployer',
      'mainMemberEmployerContact'
    ];

    if (!input.mainMemberIdNumber && !input.mainMemberPassportNumber) {
      throw new Error('Main Member ID Number or Passport Number is required.');
    }

    if (!input.mainMemberCellNumber && !input.mainMemberTelNumber) {
      throw new Error('Main Member Cell Number or Telephone Number is required.');
    }

    for (const field of required) {
      if (!(input as any)[field]) {
        throw new Error(`Main Member ${field.replace(/([A-Z])/g, ' $1').trim()} is required.`);
      }
    }
  }

  if (input.fundingType === 'medical_aid' && !input.medicalAidPlan) {
    throw new Error('Medical Aid Plan is required for medical aid patients.');
  }
}

// --- Service Functions ---

export async function createPatient(input: {
  clinicId?: string;
  patient: CreatePatientInput;
  membership?: UpsertPatientMembershipInput;
}): Promise<{ patient: PatientWithMembership }> {
  const user = await ensureAuthenticatedServer();
  const supabase = await createClient();

  const clinicId = input.clinicId || user.activeClinicId;
  if (!clinicId) throw new Error('Active Clinic Context Required');

  if (input.membership) {
    validateMembership(input.membership, input.patient.dependentCode);
  }

  const { data: patientData, error: patientError } = await supabase
    .from('patients')
    .insert({
      clinic_id: clinicId,
      first_name: input.patient.firstName,
      last_name: input.patient.lastName,
      date_of_birth: input.patient.dateOfBirth,
      gender: input.patient.gender,
      id_number: input.patient.idNumber,
      passport_number: input.patient.passportNumber,
      dependent_code: input.patient.dependentCode,
      cell_number: input.patient.cellNumber,
      tel_number: input.patient.telNumber,
      email: input.patient.email,
      postal_address: input.patient.postalAddress,
      address_city: input.patient.addressCity,
      occupation: input.patient.occupation,
      file_number: input.patient.fileNumber,
      created_by: user.id
    })
    .select()
    .single();

  if (patientError) throw new Error(patientError.message);

  let membershipData = null;

  if (input.membership) {
    const { data, error } = await supabase
      .from('patient_membership')
      .insert({
        patient_id: patientData.id,
        clinic_id: clinicId,
        funding_type: input.membership.fundingType,
        medical_aid_name: input.membership.medicalAidName,
        medical_aid_plan: input.membership.medicalAidPlan,
        medical_aid_number: input.membership.medicalAidNumber,
        patient_is_main_member: input.membership.patientIsMainMember,
        main_member_first_name: input.membership.patientIsMainMember ? null : input.membership.mainMemberFirstName,
        main_member_last_name: input.membership.patientIsMainMember ? null : input.membership.mainMemberLastName,
        main_member_id_number: input.membership.patientIsMainMember ? null : input.membership.mainMemberIdNumber,
        main_member_passport_number: input.membership.patientIsMainMember ? null : input.membership.mainMemberPassportNumber,
        main_member_cell_number: input.membership.patientIsMainMember ? null : input.membership.mainMemberCellNumber,
        main_member_tel_number: input.membership.patientIsMainMember ? null : input.membership.mainMemberTelNumber,
        main_member_occupation: input.membership.patientIsMainMember ? null : input.membership.mainMemberOccupation,
        main_member_employer: input.membership.patientIsMainMember ? null : input.membership.mainMemberEmployer,
        main_member_employer_contact: input.membership.patientIsMainMember ? null : input.membership.mainMemberEmployerContact,
        main_member_postal_address: input.membership.patientIsMainMember ? null : input.membership.mainMemberPostalAddress,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      await supabase.from('patients').delete().eq('id', patientData.id);
      throw new Error('Failed to create membership: ' + error.message);
    }
    membershipData = data;
  }

  await recordAuditEvent({
    clinicId,
    eventType: 'patient.created',
    entityType: 'patient',
    entityId: patientData.id,
    metadata: { name: `${patientData.first_name} ${patientData.last_name}` }
  });

  return {
    patient: {
      patient: mapPatient(patientData),
      membership: membershipData ? mapMembership(membershipData) : null
    }
  };
}

export async function updatePatient(
  patientId: string, 
  input: UpdatePatientInput
): Promise<{ patient: Patient }> {
  const supabase = await createClient();

  const updates: any = {};
  if (input.firstName !== undefined) updates.first_name = input.firstName;
  if (input.lastName !== undefined) updates.last_name = input.lastName;
  if (input.dateOfBirth !== undefined) updates.date_of_birth = input.dateOfBirth;
  if (input.gender !== undefined) updates.gender = input.gender;
  if (input.idNumber !== undefined) updates.id_number = input.idNumber;
  if (input.passportNumber !== undefined) updates.passport_number = input.passportNumber;
  if (input.dependentCode !== undefined) updates.dependent_code = input.dependentCode;
  if (input.cellNumber !== undefined) updates.cell_number = input.cellNumber;
  if (input.telNumber !== undefined) updates.tel_number = input.telNumber;
  if (input.email !== undefined) updates.email = input.email;
  if (input.postalAddress !== undefined) updates.postal_address = input.postalAddress;
  if (input.addressCity !== undefined) updates.address_city = input.addressCity;
  if (input.occupation !== undefined) updates.occupation = input.occupation;
  if (input.fileNumber !== undefined) updates.file_number = input.fileNumber;

  const { data, error } = await supabase
    .from('patients')
    .update(updates)
    .eq('id', patientId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await recordAuditEvent({
    clinicId: data.clinic_id,
    eventType: 'patient.updated',
    entityType: 'patient',
    entityId: data.id,
    metadata: { updates: Object.keys(input) }
  });

  return { patient: mapPatient(data) };
}

export async function upsertPatientMembership(
  patientId: string, 
  input: UpsertPatientMembershipInput
): Promise<{ membership: PatientMembership }> {
  const user = await ensureAuthenticatedServer();
  const supabase = await createClient();

  const { data: patient, error: pError } = await supabase
    .from('patients')
    .select('clinic_id, dependent_code')
    .eq('id', patientId)
    .single();

  if (pError || !patient) throw new Error('Patient not found');

  validateMembership(input, patient.dependent_code);

  const payload = {
    patient_id: patientId,
    clinic_id: patient.clinic_id,
    funding_type: input.fundingType,
    medical_aid_name: input.medicalAidName,
    medical_aid_plan: input.medicalAidPlan,
    medical_aid_number: input.medicalAidNumber,
    patient_is_main_member: input.patientIsMainMember,
    main_member_first_name: input.patientIsMainMember ? null : input.mainMemberFirstName,
    main_member_last_name: input.patientIsMainMember ? null : input.mainMemberLastName,
    main_member_id_number: input.patientIsMainMember ? null : input.mainMemberIdNumber,
    main_member_passport_number: input.patientIsMainMember ? null : input.mainMemberPassportNumber,
    main_member_cell_number: input.patientIsMainMember ? null : input.mainMemberCellNumber,
    main_member_tel_number: input.patientIsMainMember ? null : input.mainMemberTelNumber,
    main_member_occupation: input.patientIsMainMember ? null : input.mainMemberOccupation,
    main_member_employer: input.patientIsMainMember ? null : input.mainMemberEmployer,
    main_member_employer_contact: input.patientIsMainMember ? null : input.mainMemberEmployerContact,
    main_member_postal_address: input.patientIsMainMember ? null : input.mainMemberPostalAddress,
    created_by: user.id
  };

  const { data, error } = await supabase
    .from('patient_membership')
    .upsert(payload, { onConflict: 'patient_id' })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await recordAuditEvent({
    clinicId: patient.clinic_id,
    eventType: 'patient.membership_updated',
    entityType: 'patient_membership',
    entityId: data.id,
    metadata: { patientId }
  });

  return { membership: mapMembership(data) };
}

export async function getPatientById(patientId: string): Promise<{ patient: PatientWithMembership }> {
  const supabase = await createClient();

  const { data: patientData, error } = await supabase
    .from('patients')
    .select('*, patient_membership(*)')
    .eq('id', patientId)
    .single();

  if (error || !patientData) throw new Error('Patient not found');

  const membership = patientData.patient_membership?.[0] || patientData.patient_membership;
  
  return {
    patient: {
      patient: mapPatient(patientData),
      membership: membership ? mapMembership(membership) : null
    }
  };
}

export async function listPatients(input: { 
  clinicId?: string; 
  search?: string; 
  includeArchived?: boolean; 
  limit?: number; 
  offset?: number 
} = {}): Promise<{ patients: Patient[] }> {
  const user = await ensureAuthenticatedServer();
  const supabase = await createClient();
  
  const clinicId = input.clinicId || user.activeClinicId;
  if (!clinicId) throw new Error('Active Clinic Context Required');

  let query = supabase
    .from('patients')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true });

  if (!input.includeArchived) {
    query = query.is('archived_at', null);
  }

  if (input.search) {
    const s = input.search;
    query = query.or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%,cell_number.ilike.%${s}%,tel_number.ilike.%${s}%,id_number.ilike.%${s}%,file_number.ilike.%${s}%`);
  }

  if (input.limit) {
    query = query.limit(input.limit);
  }

  if (input.offset) {
    query = query.range(input.offset, input.offset + (input.limit || 20) - 1);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return { patients: data.map(mapPatient) };
}

export async function archivePatient(patientId: string): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('patients')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', patientId)
    .select('clinic_id')
    .single();
  
  if (error) throw new Error(error.message);

  await recordAuditEvent({
    clinicId: data.clinic_id,
    eventType: 'patient.archived',
    entityType: 'patient',
    entityId: patientId
  });
}

export async function unarchivePatient(patientId: string): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('patients')
    .update({ archived_at: null })
    .eq('id', patientId)
    .select('clinic_id')
    .single();
    
  if (error) throw new Error(error.message);

  await recordAuditEvent({
    clinicId: data.clinic_id,
    eventType: 'patient.unarchived',
    entityType: 'patient',
    entityId: patientId
  });
}

# Module 3: Patients & Membership

This module manages the core patient registry and their funding details.

## Key Concepts

### 1. Main Member vs. Patient
- **Patient**: The person receiving treatment (the `patients` table).
- **Main Member**: The owner of the medical aid policy (stored in `patient_membership`).

If `patient_is_main_member` is **true**:
- The patient is self-funded or holds their own policy.
- Main member fields in the database are set to NULL.
- When billing, we use the patient's details as the billing entity.

If `patient_is_main_member` is **false** (e.g., a child):
- The patient must have a `dependent_code`.
- Main member details (Name, ID, Employer) are strictly required.
- When billing, the invoice is addressed to the Main Member.

### 2. Clinic Isolation
- Every patient belongs to exactly one `clinic_id`.
- Access is strictly enforced by RLS using `public.is_member_of_clinic(clinic_id)`.
- Users must select an **active clinic** to view or create patients.

### 3. Usage in Future Modules
- **Appointments**: Link to `public.patients(id)`.
- **Billing**:
  1. Fetch `patient_membership`.
  2. If `patient_is_main_member`, invoice `patient`.
  3. Else, invoice `main_member` details from membership.

## API Endpoints
- `GET /api/patients?search=...` - List patients (default filters out archived).
- `POST /api/patients` - Create patient + membership.
- `PATCH /api/patients/[id]` - Update patient details.
- `PUT /api/patients/[id]/membership` - Upsert membership details.

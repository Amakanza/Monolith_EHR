# Module 2: Clinics & Roles - Integration Guide

This module enables multi-tenancy. Every major entity in future modules (Patients, Appointments, etc.) must belong to a `clinic`.

## 1. Context Awareness (Active Clinic)

Users can belong to multiple clinics, but they usually work in one at a time. The active context is stored in `user_profiles.active_clinic_id`.

**To get the current active clinic ID:**
```typescript
import { getActiveClinic } from '@/lib/services/clinicService';

const clinicId = await getActiveClinic();
if (!clinicId) {
  // Handle case where user hasn't selected a clinic yet
}
```

**Client-Side:**
The `CurrentUser` object now includes `activeClinicId`.
```tsx
const { user } = useCurrentUser();
console.log(user?.activeClinicId);
```

## 2. Row Level Security (RLS) for Future Tables

When creating new tables (e.g., `patients`), always include `clinic_id` and an RLS policy checking membership.

Example RLS for a future `patients` table:
```sql
create policy "Users can view patients in their clinics"
on patients for select
using (
  exists (
    select 1 from public.clinic_memberships cm
    where cm.clinic_id = patients.clinic_id
    and cm.user_id = auth.uid()
  )
);
```

## 3. Membership & Roles

Roles are defined as: `'owner' | 'admin' | 'clinician' | 'receptionist'`.

To check permission in the service layer:
```typescript
import { getClinicById } from '@/lib/services/clinicService';

const { myRole } = await getClinicById(clinicId);
if (myRole !== 'owner') throw new Error('Unauthorized');
```

## 4. Safeguards

- A clinic must always have at least one `owner`. The database trigger `check_last_owner` prevents accidental deletion of the last owner.

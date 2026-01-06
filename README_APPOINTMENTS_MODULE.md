
# Module 4: Appointments & Calendar

This module handles scheduling, appointment types, and calendar management.

## Key Features

1.  **Double-Booking Prevention**:
    *   Uses Postgres `EXCLUDE` constraint with `btree_gist` extension.
    *   Ensures that a specific `clinician_id` cannot have overlapping time ranges (`start_time`, `end_time`) if the appointment status is `'booked'`.
    *   Race-condition proof.
    *   Throws `APPOINTMENT_OVERLAP` error which is handled by the UI.

2.  **Status Lifecycle**:
    *   `booked`: Active slot. Blocks calendar.
    *   `completed`: Historic. Does NOT block calendar (allows overlapping if needed, though rare).
    *   `cancelled`: Does NOT block calendar. Reason required.
    *   `no_show`: Does NOT block calendar.

3.  **Active Clinic Context**:
    *   All appointments are scoped to `clinic_id`.
    *   Users must have `activeClinicId` set in their profile (handled by Auth module) to interact with appointments.

## Integration Guide

### 1. Linking from Patient Profile
To see appointments for a patient:
`GET /api/appointments?patientId={id}`

### 2. Dashboard Integration
To show today's appointments on the main dashboard:
`GET /api/appointments?clinicianId={me}&from={today}&to={todayEnd}`

### 3. Future Modules (Billing/Notes)
*   **Notes**: Create `clinical_notes` table with FK to `appointments.id`.
*   **Billing**: Create `invoices` table with FK to `appointments.id`. When marking appointment as `completed`, prompt user to create an invoice or note.

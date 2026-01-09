
# Module 10: Public Booking Portal

This module enables patients to book appointments online without logging in.

## Configuration
1. **Clinic Profile**: Every clinic has a `clinic_public_profiles` entry.
   - `slug`: Determines the URL (e.g., `app.com/book/my-clinic`).
   - `booking_enabled`: Master switch.
   - Access via database or future Admin UI.

2. **Environment Variables**:
   - `SUPABASE_SERVICE_ROLE_KEY` must be set in `.env` for the server to perform privileged actions (creating patients/appointments from anonymous requests).

## Features
- **Availability**: Standard 08:00 - 17:00 weekday schedule (V1). Checks for overlapping appointments for *any* available clinician.
- **Patient Matching**: Matches existing patients by Cell Number to avoid duplicates.
- **Anti-Spam**:
  - Honeypot field in form.
  - Rate limiting by IP (5 requests/hour).
  - Logs all requests to `public_booking_requests`.

## Routes
- Public Page: `/book/[slug]`
- Internal API: `/api/public/clinics/[slug]/*`

## Testing
To test locally, ensure you have a clinic set up with a public profile row and at least one appointment type and clinician.

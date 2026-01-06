
# Module 8: Telehealth

This module manages video consultation sessions linked to appointments.

## Features

### 1. Session Management
- **Providers**: Supports Zoom, Google Meet, Microsoft Teams, Jitsi, and Custom links.
- **Context**: Every session is linked 1:1 with an `appointment_id`.
- **Status**: `scheduled` -> `live` -> `ended` (or `cancelled`).

### 2. Patient Access
- **Secure Token**: Generates a random token URL (e.g., `/join/8f7a...`).
- **Safety**: The patient does not see the raw meeting link until they click "Join" on the public page.
- **Validation**: Links expire or can be deactivated.

### 3. Join Logs
- Every attempt to join via the patient link is logged in `telehealth_join_logs`.
- Tracks IP hash (conceptually), user agent, and success/failure status.

## Usage

### Creating a Session
Navigate to `/telehealth/new`, select an appointment, and paste the provider's meeting link.

### Patient Flow
1. Staff copies "Secure Patient Join Link" from session details.
2. Sends link to patient (email/SMS).
3. Patient clicks link -> Public Page (`/join/[token]`).
4. Patient clicks "Join Video Call".
5. System validates session and redirects to actual Zoom/Meet URL.

## API
- `POST /api/telehealth/sessions`: Create session.
- `POST /api/telehealth/join`: Public endpoint to exchange token for meeting URL.

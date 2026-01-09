
# Module 5: Clinical Notes & Documents

This module handles clinical documentation (SOAP notes), templates, and file attachments.

## Core Concepts

### 1. Note Lifecycle
*   **Draft**: Editable by the author.
*   **Final**: Locked. Cannot be edited. Set via the "Finalize" button in the UI.

### 2. Attachments
*   Attachments are uploaded to Supabase Storage bucket `note-attachments`.
*   We use **Signed URLs** for security.
*   Flow:
    1.  UI requests Upload URL (`POST /api/notes/:id/attachments/upload-url`).
    2.  Server returns a short-lived PUT URL.
    3.  Browser uploads file directly to Supabase Storage.
    4.  UI calls Server (`POST /api/notes/:id/attachments`) to record metadata in the DB.

### 3. Templates
*   Templates are scoped to the clinic (`clinic_id`).
*   They provide a way to standardize note names, though currently the schema only supports a JSON blob for future form builders.

## Security
*   **Row Level Security (RLS)** ensures users can only access notes/templates for clinics they are members of.
*   **Service Layer** enforces that finalized notes cannot be updated.

## Usage
*   **List Notes**: Go to a Patient -> "Clinical Notes".
*   **Create Note**: Link optionally to an Appointment for context.
*   **Finalize**: Only finalize when documentation is complete.

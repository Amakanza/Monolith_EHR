
# Module 7: Communications

This module handles all outbound messaging (SMS, Email, WhatsApp) and internal staff notifications.

## Key Features

### 1. Unified Outbox
- All messages are stored in `outbound_messages`.
- Statuses: `queued` -> `sending` -> `sent` (or `failed`).
- Supports scheduling via `planned_send_at`.

### 2. Appointment Reminders
- Automatically queued when an appointment is created via `appointmentService`.
- Defaults to 24 hours before the appointment.
- Uses SMS if mobile number is present, otherwise falls back to Email.

### 3. Templates
- Clinics can define templates (`message_templates`) for reuse.
- Supports placeholders (conceptually, in V1 effectively just text copy-paste).

### 4. Staff Notifications
- In-app notification bell.
- Polls for new unread notifications every 60 seconds.

## Usage

### Queueing a Message manually
`POST /api/messages`
```json
{
  "patientId": "...",
  "channel": "sms",
  "body": "Hello World"
}
```

### Marking as Sent (Provider Callback)
In a real deployment, a webhook from Twilio/SendGrid would call this. For V1, use the UI "Mark Sent" button.
`POST /api/messages/:id/mark-sent`

## Integration Guide
- **Appointments**: `createAppointment` automatically calls `queueAppointmentReminder`.
- **UI**: Use `<NotificationBell />` in the layout header to show alerts.

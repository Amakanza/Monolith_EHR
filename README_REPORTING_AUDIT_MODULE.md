
# Module 9: Reporting & Audit

This module provides visibility into clinic operations through dashboards, activity logging, and data exports.

## Features

### 1. Dashboard
- **Key Metrics**: Active patients, new patients, appointment breakdown, revenue overview, and documentation activity.
- **Date Filtering**: Metrics can be filtered by custom date ranges (default: last 30 days).
- **Efficiency**: Calculations are performed using efficient database queries (`count`, filtered selects) to minimize load.

### 2. Audit Trail
- **Centralized Log**: All key actions (create, update, delete, status change) across the system are recorded in the `audit_events` table.
- **Context**: Events store `actor_user_id`, `event_type`, `entity_type`, and JSON `metadata` for detailed context.
- **Visibility**: Clinic admins can view a chronological feed of who did what.

### 3. Data Exports
- **CSV Format**: Standard CSV exports for interoperability.
- **Entities**: Patients, Appointments, and Invoices.
- **Security**: Exports respect the user's active clinic context.

## Integration

### Recording Events
Services should import `recordAuditEvent` to log actions. This function is designed to be non-blocking (fire-and-forget).

```typescript
import { recordAuditEvent } from '@/lib/services/reportingService';

await recordAuditEvent({
  clinicId: '...',
  eventType: 'patient.created',
  entityType: 'patient',
  entityId: '...',
  metadata: { name: 'John Doe' }
});
```

## API Endpoints
- `GET /api/reports/dashboard`: JSON metrics.
- `GET /api/reports/audit`: JSON audit logs.
- `GET /api/exports/[entity]`: CSV file download.

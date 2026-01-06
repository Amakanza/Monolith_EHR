
# Module 6: Billing & Invoicing

This module provides a robust invoicing system with sequential numbering, line items, and payment tracking.

## Key Features

1. **Sequential Invoice Numbers**
   - We use a database counter per clinic to ensure invoices are numbered sequentially (e.g., `INV-000001`).
   - This logic is handled atomically via a Postgres RPC function `generate_invoice_number`.

2. **Money Handling**
   - All monetary values are stored as **integers in cents** (e.g., $10.00 is stored as `1000`).
   - The UI handles formatting.

3. **Status Workflow**
   - `draft`: Editable. Items can be added/removed.
   - `sent`: Locked for editing (soft lock), usually when emailed to patient.
   - `paid`: Balance due is 0.
   - `void`: Cancelled. No further payments or edits allowed.

4. **Medical Aid Snapshots**
   - When an invoice is created, we snapshot the patient's current medical aid details. This ensures historical accuracy if the patient changes providers later.

5. **Calculations**
   - Totals (Subtotal, Tax, Total, Paid, Balance) are recalculated in the Service Layer whenever items or payments change.

## Usage

### Creating an Invoice
`POST /api/invoices`
```json
{
  "patientId": "...",
  "taxRate": 15
}
```

### Adding Items
`POST /api/invoices/:id/items`
```json
{
  "description": "Consultation",
  "quantity": 1,
  "unitPriceCents": 50000
}
```

### Recording Payment
`POST /api/invoices/:id/payments`
```json
{
  "amountCents": 50000,
  "method": "medical_aid",
  "paymentDate": "2024-01-01"
}
```

### Printing
Navigate to `/api/invoices/:id/print` to get a browser-printable view.

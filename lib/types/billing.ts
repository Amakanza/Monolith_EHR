
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'void';
export type PaymentMethod = 'cash' | 'eft' | 'card' | 'medical_aid' | 'other';
export type ClaimStatus = 'not_submitted' | 'submitted' | 'paid' | 'rejected';

export interface Invoice {
  id: string;
  clinicId: string;
  patientId: string;
  appointmentId: string | null;
  noteId: string | null;
  
  invoiceNumber: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string | null;
  
  status: InvoiceStatus;
  
  currency: string;
  taxRate: number; // e.g., 15.00
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  amountPaidCents: number;
  // Alias: some parts of the codebase use `balanceCents` while others use `balanceDueCents`.
  // Keep both for compatibility; they represent the same value (amount still owing).
  balanceDueCents: number;
  balanceCents: number;
  
  internalNote: string | null;
  publicNote: string | null;
  
  // Snapshots
  claimStatus: ClaimStatus | null;
  claimReference: string | null;
  mainMemberNameSnapshot: string | null;
  medicalAidNameSnapshot: string | null;
  medicalAidPlanSnapshot: string | null;
  medicalAidNumberSnapshot: string | null;
  dependentCodeSnapshot: string | null;
  
  createdBy: string;
  createdAt: string;
  updatedAt: string;

  // Joined fields
  patientName?: string;
  patient?: { firstName: string; lastName: string };
  creatorName?: string;
}

export interface InvoiceItem {
  id: string;
  clinicId: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  lineSubtotalCents: number;
  createdAt: string;
}

export interface Payment {
  id: string;
  clinicId: string;
  invoiceId: string;
  patientId: string;
  paymentDate: string;
  method: PaymentMethod;
  amountCents: number;
  reference: string | null;
  receivedBy: string;
  createdAt: string;
  
  // Joined
  receiverName?: string;
}

export interface InvoiceWithItemsAndPayments {
  invoice: Invoice;
  items: InvoiceItem[];
  payments: Payment[];
}

// Inputs

export interface CreateInvoiceInput {
  patientId: string;
  appointmentId?: string;
  noteId?: string;
  taxRate?: number;
  dueDate?: string;
  currency?: string;
  internalNote?: string;
  publicNote?: string;
}

export interface UpdateInvoiceInput {
  dueDate?: string | null;
  taxRate?: number;
  internalNote?: string | null;
  publicNote?: string | null;
  claimStatus?: ClaimStatus | null;
  claimReference?: string | null;
}

export interface AddInvoiceItemInput {
  description: string;
  quantity: number;
  unitPriceCents: number;
}

export interface UpdateInvoiceItemInput {
  description?: string;
  quantity?: number;
  unitPriceCents?: number;
}

export interface CreatePaymentInput {
  paymentDate: string;
  method: PaymentMethod;
  amountCents: number;
  reference?: string;
}

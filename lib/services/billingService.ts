
import { createClient } from '@/lib/server/supabase/server';
import { ensureAuthenticatedServer } from '@/lib/services/authService';
import { dbToAppProfile } from '@/lib/mappers/userProfile';
import { 
  AddInvoiceItemInput, 
  CreateInvoiceInput, 
  CreatePaymentInput, 
  Invoice, 
  InvoiceItem, 
  InvoiceStatus, 
  InvoiceWithItemsAndPayments, 
  Payment, 
  UpdateInvoiceInput, 
  UpdateInvoiceItemInput 
} from '@/lib/types/billing';
import { recordAuditEvent } from '@/lib/services/reportingService';

// --- Mappers ---

function mapInvoice(row: any): Invoice {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    appointmentId: row.appointment_id,
    noteId: row.note_id,
    invoiceNumber: row.invoice_number,
    issuedDate: row.issued_date,
    dueDate: row.due_date,
    status: row.status as InvoiceStatus,
    currency: row.currency,
    taxRate: Number(row.tax_rate),
    subtotalCents: Number(row.subtotal_cents),
    taxCents: Number(row.tax_cents),
    totalCents: Number(row.total_cents),
    amountPaidCents: Number(row.amount_paid_cents),
    balanceDueCents: Number(row.balance_due_cents),

    internalNote: row.internal_note,
    publicNote: row.public_note,
    claimStatus: row.claim_status,
    claimReference: row.claim_reference,
    mainMemberNameSnapshot: row.main_member_name_snapshot,
    medicalAidNameSnapshot: row.medical_aid_name_snapshot,
    medicalAidPlanSnapshot: row.medical_aid_plan_snapshot,
    medicalAidNumberSnapshot: row.medical_aid_number_snapshot,
    dependentCodeSnapshot: row.dependent_code_snapshot,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    patientName: row.patients ? `${row.patients.first_name} ${row.patients.last_name}` : undefined,
    creatorName: row.user_profiles ? (dbToAppProfile(row.user_profiles).fullName || undefined) : undefined,
  };
}

function mapItem(row: any): InvoiceItem {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    invoiceId: row.invoice_id,
    description: row.description,
    quantity: Number(row.quantity),
    unitPriceCents: Number(row.unit_price_cents),
    lineSubtotalCents: Number(row.line_subtotal_cents),
    createdAt: row.created_at,
  };
}

function mapPayment(row: any): Payment {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    invoiceId: row.invoice_id,
    patientId: row.patient_id,
    paymentDate: row.payment_date,
    method: row.method,
    amountCents: Number(row.amount_cents),
    reference: row.reference,
    receivedBy: row.received_by,
    createdAt: row.created_at,
    receiverName: row.user_profiles ? (dbToAppProfile(row.user_profiles).fullName || undefined) : undefined,
  };
}

// --- Helpers ---

async function recalculateInvoiceTotals(invoiceId: string) {
  const supabase = await createClient();
  
  const { data: items } = await supabase
    .from('invoice_items')
    .select('line_subtotal_cents')
    .eq('invoice_id', invoiceId);
    
  const subtotalCents = items?.reduce((sum, item) => sum + Number(item.line_subtotal_cents), 0) || 0;
  
  const { data: payments } = await supabase
    .from('payments')
    .select('amount_cents')
    .eq('invoice_id', invoiceId);
    
  const amountPaidCents = payments?.reduce((sum, p) => sum + Number(p.amount_cents), 0) || 0;
  
  const { data: inv } = await supabase
    .from('invoices')
    .select('tax_rate, status')
    .eq('id', invoiceId)
    .single();
    
  if (!inv) return;
  
  const taxRate = Number(inv.tax_rate);
  const taxCents = Math.round(subtotalCents * (taxRate / 100));
  const totalCents = subtotalCents + taxCents;
  const balanceDueCents = Math.max(totalCents - amountPaidCents, 0);

  let status = inv.status;
  if (status !== 'void' && balanceDueCents === 0 && totalCents > 0) {
    status = 'paid';
  } else if (status === 'paid' && balanceDueCents > 0) {
    status = 'sent'; 
  }

  await supabase
    .from('invoices')
    .update({
      subtotal_cents: subtotalCents,
      tax_cents: taxCents,
      total_cents: totalCents,
      amount_paid_cents: amountPaidCents,
      balance_due_cents: balanceDueCents,
      status: status
    })
    .eq('id', invoiceId);
}

// --- Core Services ---

export async function createInvoice(input: CreateInvoiceInput & { clinicId?: string }): Promise<{ invoice: Invoice }> {
  const user = await ensureAuthenticatedServer();
  const supabase = await createClient();
  const clinicId = input.clinicId || user.activeClinicId;
  if (!clinicId) throw new Error('ACTIVE_CLINIC_REQUIRED');

  const { data: invoiceNum, error: rpcError } = await supabase.rpc('generate_invoice_number', {
    _clinic_id: clinicId
  });
  if (rpcError) throw new Error(rpcError.message);

  const { data: mem } = await supabase
    .from('patient_membership')
    .select('*')
    .eq('patient_id', input.patientId)
    .single();

  const { data: inv, error: invError } = await supabase
    .from('invoices')
    .insert({
      clinic_id: clinicId,
      patient_id: input.patientId,
      appointment_id: input.appointmentId,
      note_id: input.noteId,
      invoice_number: invoiceNum,
      tax_rate: input.taxRate ?? 0,
      due_date: input.dueDate,
      currency: input.currency || 'NAD',
      internal_note: input.internalNote,
      public_note: input.publicNote,
      created_by: user.id,
      
      main_member_name_snapshot: mem ? (mem.patient_is_main_member ? null : `${mem.main_member_first_name} ${mem.main_member_last_name}`) : null,
      main_member_id_snapshot: mem ? mem.main_member_id_number : null,
      medical_aid_name_snapshot: mem ? mem.medical_aid_name : null,
      medical_aid_plan_snapshot: mem ? mem.medical_aid_plan : null,
      medical_aid_number_snapshot: mem ? mem.medical_aid_number : null,
      dependent_code_snapshot: mem ? (await supabase.from('patients').select('dependent_code').eq('id', input.patientId).single()).data?.dependent_code : null
    })
    .select('*, patients(first_name, last_name), user_profiles(full_name)')
    .single();

  if (invError) throw new Error(invError.message);

  await recordAuditEvent({
    clinicId,
    eventType: 'invoice.created',
    entityType: 'invoice',
    entityId: inv.id,
    metadata: { invoiceNumber: inv.invoice_number }
  });

  return { invoice: mapInvoice(inv) };
}

export async function getInvoiceById(invoiceId: string): Promise<InvoiceWithItemsAndPayments> {
  const supabase = await createClient();
  
  const { data: inv, error } = await supabase
    .from('invoices')
    .select('*, patients(first_name, last_name), user_profiles(full_name)')
    .eq('id', invoiceId)
    .single();

  if (error || !inv) throw new Error('Invoice not found');

  const { data: items } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: true });

  const { data: payments } = await supabase
    .from('payments')
    .select('*, user_profiles(full_name)')
    .eq('invoice_id', invoiceId)
    .order('payment_date', { ascending: false });

  return {
    invoice: mapInvoice(inv),
    items: (items || []).map(mapItem),
    payments: (payments || []).map(mapPayment)
  };
}

export async function listInvoices(query: { clinicId?: string; patientId?: string; status?: InvoiceStatus; limit?: number }): Promise<{ invoices: Invoice[] }> {
  const user = await ensureAuthenticatedServer();
  const supabase = await createClient();
  const clinicId = query.clinicId || user.activeClinicId;
  if (!clinicId) throw new Error('ACTIVE_CLINIC_REQUIRED');

  let q = supabase
    .from('invoices')
    .select('*, patients(first_name, last_name), user_profiles(full_name)')
    .eq('clinic_id', clinicId)
    .order('issued_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (query.patientId) q = q.eq('patient_id', query.patientId);
  if (query.status) q = q.eq('status', query.status);
  if (query.limit) q = q.limit(query.limit);

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  return { invoices: data.map(mapInvoice) };
}

export async function updateInvoice(invoiceId: string, input: UpdateInvoiceInput): Promise<{ invoice: Invoice }> {
  const supabase = await createClient();
  
  const { data: current } = await supabase.from('invoices').select('status').eq('id', invoiceId).single();
  if (current?.status === 'void') throw new Error('Cannot edit void invoice');

  const updates: any = {};
  if (input.dueDate !== undefined) updates.due_date = input.dueDate;
  if (input.taxRate !== undefined) updates.tax_rate = input.taxRate;
  if (input.internalNote !== undefined) updates.internal_note = input.internalNote;
  if (input.publicNote !== undefined) updates.public_note = input.publicNote;
  if (input.claimStatus !== undefined) updates.claim_status = input.claimStatus;
  if (input.claimReference !== undefined) updates.claim_reference = input.claimReference;

  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', invoiceId)
    .select('*, patients(first_name, last_name), user_profiles(full_name)')
    .single();

  if (error) throw new Error(error.message);
  
  if (input.taxRate !== undefined) {
    await recalculateInvoiceTotals(invoiceId);
    const { data: refreshed } = await supabase
      .from('invoices')
      .select('*, patients(first_name, last_name), user_profiles(full_name)')
      .eq('id', invoiceId)
      .single();
    return { invoice: mapInvoice(refreshed) };
  }

  return { invoice: mapInvoice(data) };
}

export async function sendInvoice(invoiceId: string): Promise<void> {
  const supabase = await createClient();
  const { data: current } = await supabase.from('invoices').select('status, clinic_id').eq('id', invoiceId).single();
  if (!current) throw new Error('Not found');
  
  if (current.status === 'draft') {
    await supabase.from('invoices').update({ status: 'sent' }).eq('id', invoiceId);
    await recordAuditEvent({
      clinicId: current.clinic_id,
      eventType: 'invoice.sent',
      entityType: 'invoice',
      entityId: invoiceId
    });
  }
}

export async function voidInvoice(invoiceId: string): Promise<void> {
  const supabase = await createClient();
  const { data: current } = await supabase.from('invoices').select('clinic_id').eq('id', invoiceId).single();
  
  await supabase.from('invoices').update({ status: 'void', balance_due_cents: 0 }).eq('id', invoiceId);
  
  if (current) {
    await recordAuditEvent({
      clinicId: current.clinic_id,
      eventType: 'invoice.voided',
      entityType: 'invoice',
      entityId: invoiceId
    });
  }
}

// --- Item Management ---

export async function addInvoiceItem(invoiceId: string, input: AddInvoiceItemInput): Promise<{ item: InvoiceItem }> {
  const user = await ensureAuthenticatedServer();
  const supabase = await createClient();

  const { data: inv } = await supabase.from('invoices').select('clinic_id, status').eq('id', invoiceId).single();
  if (!inv) throw new Error('Invoice not found');
  if (inv.status === 'paid' || inv.status === 'void') throw new Error('Cannot add items to paid/void invoice');

  const lineTotal = Math.round(input.quantity * input.unitPriceCents);

  const { data, error } = await supabase
    .from('invoice_items')
    .insert({
      clinic_id: inv.clinic_id,
      invoice_id: invoiceId,
      description: input.description,
      quantity: input.quantity,
      unit_price_cents: input.unitPriceCents,
      line_subtotal_cents: lineTotal
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await recalculateInvoiceTotals(invoiceId);

  return { item: mapItem(data) };
}

export async function updateInvoiceItem(itemId: string, input: UpdateInvoiceItemInput): Promise<{ item: InvoiceItem }> {
  const supabase = await createClient();
  
  const { data: item } = await supabase.from('invoice_items').select('invoice_id').eq('id', itemId).single();
  if (!item) throw new Error('Item not found');
  
  const updates: any = {};
  if (input.description) updates.description = input.description;
  
  if (input.quantity !== undefined || input.unitPriceCents !== undefined) {
    const { data: current } = await supabase.from('invoice_items').select('quantity, unit_price_cents').eq('id', itemId).single();
    if (!current) throw new Error('Invoice item not found');
    const q = input.quantity ?? current.quantity;
    const p = input.unitPriceCents ?? current.unit_price_cents;
    updates.quantity = q;
    updates.unit_price_cents = p;
    updates.line_subtotal_cents = Math.round(q * p);
  }

  const { data, error } = await supabase
    .from('invoice_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await recalculateInvoiceTotals(item.invoice_id);

  return { item: mapItem(data) };
}

export async function removeInvoiceItem(itemId: string): Promise<void> {
  const supabase = await createClient();
  const { data: item } = await supabase.from('invoice_items').select('invoice_id').eq('id', itemId).single();
  if (!item) return;

  await supabase.from('invoice_items').delete().eq('id', itemId);
  await recalculateInvoiceTotals(item.invoice_id);
}

// --- Payments ---

export async function createPayment(invoiceId: string, input: CreatePaymentInput): Promise<{ payment: Payment }> {
  const user = await ensureAuthenticatedServer();
  const supabase = await createClient();

  const { data: inv } = await supabase.from('invoices').select('clinic_id, patient_id, status').eq('id', invoiceId).single();
  if (!inv) throw new Error('Invoice not found');
  if (inv.status === 'void') throw new Error('Cannot pay void invoice');

  const { data, error } = await supabase
    .from('payments')
    .insert({
      clinic_id: inv.clinic_id,
      invoice_id: invoiceId,
      patient_id: inv.patient_id,
      payment_date: input.paymentDate,
      method: input.method,
      amount_cents: input.amountCents,
      reference: input.reference,
      received_by: user.id
    })
    .select('*, user_profiles(full_name)')
    .single();

  if (error) throw new Error(error.message);

  await recalculateInvoiceTotals(invoiceId);

  await recordAuditEvent({
    clinicId: inv.clinic_id,
    eventType: 'payment.received',
    entityType: 'payment',
    entityId: data.id,
    metadata: { invoiceId, amount: input.amountCents }
  });

  return { payment: mapPayment(data) };
}

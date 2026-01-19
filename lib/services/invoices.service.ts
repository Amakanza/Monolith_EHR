
import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { getActiveClinic } from '@/lib/server/clinic/get-active-clinic';
import { z } from 'zod';
import { Invoice, InvoiceWithItemsAndPayments } from '@/lib/types/billing';
import { logEvent } from './audit.service';

// --- Zod Schemas ---

export const createInvoiceSchema = z.object({
  patientId: z.string().uuid(),
  issueDate: z.string().date(), // YYYY-MM-DD
  dueDate: z.string().date().optional(),
  notes: z.string().optional(),
});

export const addLineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().min(1),
  unitPriceCents: z.number().min(0),
});

export const recordPaymentSchema = z.object({
  amountCents: z.number().positive(),
  method: z.string().min(1),
  paymentDate: z.string().date(),
  reference: z.string().optional(),
});

export const updateLineItemSchema = addLineItemSchema.partial();

// --- Service Functions ---

export async function listInvoices(): Promise<Invoice[]> {
  const { clinicId } = await getActiveClinic();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      patient:patients(first_name, last_name)
    `)
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return data.map((row: any) => ({
    ...row,
    patient: row.patient ? { firstName: row.patient.first_name, lastName: row.patient.last_name } : undefined,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    totalCents: row.total_cents,
    amountPaidCents: row.amount_paid_cents,
    balanceCents: row.balance_cents,
    balanceDueCents: row.balance_cents,
    invoiceNumber: row.invoice_number,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    createdAt: row.created_at
  }));
}

export async function createInvoice(input: z.infer<typeof createInvoiceSchema>): Promise<Invoice> {
  const { clinicId } = await getActiveClinic();
  const supabase = await createClient();
  
  const parsed = createInvoiceSchema.parse(input);

  // Auto-generate invoice number
  let invoiceNumber = `INV-${Date.now()}`; // Fallback
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('generate_invoice_number', {
      clinic_id_param: clinicId // Parameter name depends on RPC definition, commonly just args if positional
    });
    // Try positional if named param fails or just assume RPC returns text
    if (!rpcError && rpcData) {
      invoiceNumber = rpcData;
    } else {
        // Retry with just clinic_id if the param name was different
        const { data: rpcData2, error: rpcError2 } = await supabase.rpc('generate_invoice_number', {
            clinic_id: clinicId 
        });
        if (!rpcError2 && rpcData2) invoiceNumber = rpcData2;
    }
  } catch (e) {
    console.warn("Failed to generate invoice number via RPC, using fallback", e);
  }

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      clinic_id: clinicId,
      patient_id: parsed.patientId,
      invoice_number: invoiceNumber,
      issue_date: parsed.issueDate,
      due_date: parsed.dueDate,
      notes: parsed.notes,
      status: 'draft',
      total_cents: 0,
      amount_paid_cents: 0,
      balance_cents: 0,
    })
    .select()
    .single();

  if (error) throw error;

  await logEvent({
    action: 'create',
    entityType: 'invoice',
    entityId: data.id,
    metadata: { invoiceNumber: data.invoice_number }
  });
  
  return {
    ...data,
    issueDate: data.issue_date,
    dueDate: data.due_date,
    totalCents: data.total_cents,
    amountPaidCents: data.amount_paid_cents,
    balanceCents: data.balance_cents,
    invoiceNumber: data.invoice_number,
    clinicId: data.clinic_id,
    patientId: data.patient_id,
    createdAt: data.created_at
  };
}

export async function getInvoiceById(invoiceId: string): Promise<InvoiceWithItemsAndPayments> {
  const { clinicId } = await getActiveClinic();
  const supabase = await createClient();

  const { data: invoice, error: invError } = await supabase
    .from('invoices')
    .select(`*, patient:patients(first_name, last_name)`)
    .eq('id', invoiceId)
    .eq('clinic_id', clinicId)
    .single();

  if (invError) throw invError;

  const { data: items, error: itemsError } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: true });

  if (itemsError) throw itemsError;

  const { data: payments, error: paymentsError } = await supabase
    .from('invoice_payments')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('payment_date', { ascending: false });

  if (paymentsError) throw paymentsError;

  return {
    ...invoice,
    patient: invoice.patient ? { firstName: invoice.patient.first_name, lastName: invoice.patient.last_name } : undefined,
    issueDate: invoice.issue_date,
    dueDate: invoice.due_date,
    totalCents: invoice.total_cents,
    amountPaidCents: invoice.amount_paid_cents,
    balanceCents: invoice.balance_cents,
    invoiceNumber: invoice.invoice_number,
    clinicId: invoice.clinic_id,
    patientId: invoice.patient_id,
    createdAt: invoice.created_at,
    items: items.map((i: any) => ({
      ...i,
      unitPriceCents: i.unit_price_cents,
      totalCents: i.total_cents,
      invoiceId: i.invoice_id
    })),
    payments: payments.map((p: any) => ({
      ...p,
      invoiceId: p.invoice_id,
      amountCents: p.amount_cents,
      paymentDate: p.payment_date,
      createdAt: p.created_at
    }))
  };
}

export async function addLineItem(invoiceId: string, input: z.infer<typeof addLineItemSchema>) {
  const { clinicId } = await getActiveClinic();
  const supabase = await createClient();
  const parsed = addLineItemSchema.parse(input);

  const totalCents = parsed.quantity * parsed.unitPriceCents;

  const { error } = await supabase.from('invoice_items').insert({
    invoice_id: invoiceId,
    description: parsed.description,
    quantity: parsed.quantity,
    unit_price_cents: parsed.unitPriceCents,
    total_cents: totalCents
  });

  if (error) throw error;
  await recalculateInvoiceTotals(invoiceId, clinicId);
  
  await logEvent({
    action: 'update',
    entityType: 'invoice',
    entityId: invoiceId,
    metadata: { subAction: 'add_item', description: parsed.description }
  });
}

export async function deleteLineItem(itemId: string) {
  const { clinicId } = await getActiveClinic();
  const supabase = await createClient();

  // Get invoice ID first to recalc later
  const { data: item } = await supabase.from('invoice_items').select('invoice_id').eq('id', itemId).single();
  if (!item) throw new Error("Item not found");

  const { error } = await supabase.from('invoice_items').delete().eq('id', itemId);
  if (error) throw error;

  await recalculateInvoiceTotals(item.invoice_id, clinicId);

  await logEvent({
    action: 'update',
    entityType: 'invoice',
    entityId: item.invoice_id,
    metadata: { subAction: 'delete_item', itemId }
  });
}

export async function recordPayment(invoiceId: string, input: z.infer<typeof recordPaymentSchema>) {
  const { clinicId } = await getActiveClinic();
  const supabase = await createClient();
  const parsed = recordPaymentSchema.parse(input);

  const { error } = await supabase.from('invoice_payments').insert({
    invoice_id: invoiceId,
    amount_cents: parsed.amountCents,
    method: parsed.method,
    payment_date: parsed.paymentDate,
    reference: parsed.reference,
  });

  if (error) throw error;
  await recalculateInvoiceTotals(invoiceId, clinicId);

  await logEvent({
    action: 'pay',
    entityType: 'invoice',
    entityId: invoiceId,
    metadata: { amount: parsed.amountCents }
  });
}

// Internal helper to update totals
async function recalculateInvoiceTotals(invoiceId: string, clinicId: string) {
  const supabase = await createClient();

  // Sum items
  const { data: items } = await supabase
    .from('invoice_items')
    .select('total_cents')
    .eq('invoice_id', invoiceId);
  
  const totalCents = items?.reduce((sum, item) => sum + item.total_cents, 0) || 0;

  // Sum payments
  const { data: payments } = await supabase
    .from('invoice_payments')
    .select('amount_cents')
    .eq('invoice_id', invoiceId);

  const amountPaidCents = payments?.reduce((sum, p) => sum + p.amount_cents, 0) || 0;
  const balanceCents = totalCents - amountPaidCents;

  let status = 'draft';
  // Simple status logic
  if (balanceCents <= 0 && totalCents > 0) status = 'paid';
  else if (balanceCents < totalCents && balanceCents > 0) status = 'issued'; // Partial
  else status = 'issued'; 
  
  // If it was draft and we have 0 total, stay draft. If items added, assume issued for MVP simplicity 
  // or check current status. For MVP, let's toggle to issued if balance > 0
  
  // Actually, usually status is manual or specific transition. 
  // Let's just update amounts and set to 'paid' if 0 balance.
  const { data: curr } = await supabase.from('invoices').select('status').eq('id', invoiceId).single();
  if (curr?.status === 'draft' && totalCents > 0) status = 'issued';
  if (balanceCents <= 0 && totalCents > 0) status = 'paid';
  if (curr?.status === 'draft' && totalCents === 0) status = 'draft';

  await supabase.from('invoices').update({
    total_cents: totalCents,
    amount_paid_cents: amountPaidCents,
    balance_cents: balanceCents,
    status
  }).eq('id', invoiceId).eq('clinic_id', clinicId);
}

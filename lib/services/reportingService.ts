
import { createClient } from '@/lib/services/supabase/server';
import { ensureAuthenticatedServer, getCurrentUserServer } from '@/lib/services/authService';
import { AuditEvent, AuditLogQuery, DashboardMetrics, DateRangeQuery } from '@/lib/types/reporting';
import { getClinicById } from '@/lib/services/clinicService';

// --- Mappers ---

function mapAuditEvent(row: any): AuditEvent {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    actorUserId: row.actor_user_id,
    actorRole: row.actor_role,
    eventType: row.event_type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    metadata: row.metadata,
    createdAt: row.created_at,
    actorName: row.user_profiles?.full_name || 'Unknown'
  };
}

// --- Dashboard ---

export async function getClinicDashboard(query: DateRangeQuery): Promise<{ metrics: DashboardMetrics }> {
  const user = await ensureAuthenticatedServer();
  const supabase = await createClient();
  const clinicId = query.clinicId || user.activeClinicId;
  if (!clinicId) throw new Error('ACTIVE_CLINIC_REQUIRED');

  const from = query.from ? new Date(query.from).toISOString() : new Date(new Date().setDate(new Date().getDate() - 30)).toISOString();
  const to = query.to ? new Date(new Date(query.to).setHours(23, 59, 59, 999)).toISOString() : new Date().toISOString();

  // 1. Active Patients (Total)
  const { count: activePatients } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .eq('clinic_id', clinicId)
    .is('archived_at', null);

  // 2. New Patients (In Range)
  const { count: newPatients } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .eq('clinic_id', clinicId)
    .gte('created_at', from)
    .lte('created_at', to);

  // 3. Appointments by Status (In Range of Start Time)
  const { data: appointments } = await supabase
    .from('appointments')
    .select('status')
    .eq('clinic_id', clinicId)
    .gte('start_time', from)
    .lte('start_time', to);

  const appointmentsByStatus = {
    booked: 0,
    completed: 0,
    cancelled: 0,
    no_show: 0
  };
  
  appointments?.forEach((a: any) => {
    const s = a.status as keyof typeof appointmentsByStatus;
    if (appointmentsByStatus[s] !== undefined) appointmentsByStatus[s]++;
  });

  // 4. Notes Created (In Range)
  const { count: notesCreated } = await supabase
    .from('clinical_notes')
    .select('*', { count: 'exact', head: true })
    .eq('clinic_id', clinicId)
    .gte('created_at', from)
    .lte('created_at', to);

  // 5. Invoices Revenue (In Range of Issued Date)
  const { data: invoices } = await supabase
    .from('invoices')
    .select('total_cents, amount_paid_cents, balance_due_cents, status')
    .eq('clinic_id', clinicId)
    .gte('issued_date', from.split('T')[0])
    .lte('issued_date', to.split('T')[0])
    .neq('status', 'void');

  const invoicesTotals = {
    totalCents: 0,
    paidCents: 0,
    balanceCents: 0
  };

  invoices?.forEach((inv: any) => {
    invoicesTotals.totalCents += Number(inv.total_cents);
    invoicesTotals.paidCents += Number(inv.amount_paid_cents);
    invoicesTotals.balanceCents += Number(inv.balance_due_cents);
  });

  return {
    metrics: {
      activePatients: activePatients || 0,
      newPatientsInRange: newPatients || 0,
      appointmentsByStatus,
      notesCreated: notesCreated || 0,
      invoicesTotals
    }
  };
}

// --- Audit Logging ---

export async function recordAuditEvent(input: { 
  clinicId: string; 
  eventType: string; 
  entityType: string; 
  entityId?: string | null; 
  metadata?: any 
}): Promise<void> {
  // Use current user from server context if available, otherwise might be system action (not handled here yet)
  const user = await getCurrentUserServer();
  if (!user) return; // Should allow logging if system? For now assume user-driven.

  const supabase = await createClient();
  
  // Fire and forget, don't block
  supabase.from('audit_events').insert({
    clinic_id: input.clinicId,
    actor_user_id: user.id,
    actor_role: 'user', // Simplified, could fetch role if needed
    event_type: input.eventType,
    entity_type: input.entityType,
    entity_id: input.entityId,
    metadata: input.metadata || {}
  }).then(({ error }) => {
    if (error) console.error('Failed to record audit event', error);
  });
}

export async function listAuditEvents(query: AuditLogQuery): Promise<{ events: AuditEvent[] }> {
  const user = await ensureAuthenticatedServer();
  const supabase = await createClient();
  const clinicId = query.clinicId || user.activeClinicId;
  if (!clinicId) throw new Error('ACTIVE_CLINIC_REQUIRED');

  let dbQuery = supabase
    .from('audit_events')
    .select('*, user_profiles(full_name)')
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false });

  if (query.from) dbQuery = dbQuery.gte('created_at', new Date(query.from).toISOString());
  if (query.to) dbQuery = dbQuery.lte('created_at', new Date(query.to).toISOString());
  if (query.eventType) dbQuery = dbQuery.eq('event_type', query.eventType);
  if (query.actorUserId) dbQuery = dbQuery.eq('actor_user_id', query.actorUserId);
  
  if (query.limit) dbQuery = dbQuery.limit(query.limit);
  if (query.offset) dbQuery = dbQuery.range(query.offset, query.offset + (query.limit || 50) - 1);

  const { data, error } = await dbQuery;
  if (error) throw new Error(error.message);

  return { events: data.map(mapAuditEvent) };
}

// --- Exports ---

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function exportPatientsCsv(input: { clinicId?: string; includeArchived?: boolean }): Promise<{ csv: string }> {
  const user = await ensureAuthenticatedServer();
  const supabase = await createClient();
  const clinicId = input.clinicId || user.activeClinicId;
  if (!clinicId) throw new Error('ACTIVE_CLINIC_REQUIRED');

  let q = supabase
    .from('patients')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('last_name', { ascending: true });

  if (!input.includeArchived) q = q.is('archived_at', null);

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  const header = ['ID', 'First Name', 'Last Name', 'DOB', 'Gender', 'ID Number', 'Email', 'Cell', 'File No', 'Created At'];
  const rows = data.map((p: any) => [
    p.id,
    p.first_name,
    p.last_name,
    p.date_of_birth,
    p.gender,
    p.id_number || p.passport_number,
    p.email,
    p.cell_number,
    p.file_number,
    p.created_at
  ]);

  const csv = [
    header.join(','),
    ...rows.map((r: any[]) => r.map(escapeCsv).join(','))
  ].join('\n');

  return { csv };
}

export async function exportAppointmentsCsv(input: DateRangeQuery): Promise<{ csv: string }> {
  const user = await ensureAuthenticatedServer();
  const supabase = await createClient();
  const clinicId = input.clinicId || user.activeClinicId;
  if (!clinicId) throw new Error('ACTIVE_CLINIC_REQUIRED');

  let q = supabase
    .from('appointments')
    .select('*, patients(first_name, last_name), user_profiles(full_name), appointment_types(name)')
    .eq('clinic_id', clinicId)
    .order('start_time', { ascending: false });

  if (input.from) q = q.gte('start_time', new Date(input.from).toISOString());
  if (input.to) q = q.lte('start_time', new Date(input.to).toISOString());

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  const header = ['ID', 'Start', 'End', 'Patient', 'Clinician', 'Type', 'Status', 'Note'];
  const rows = data.map((a: any) => [
    a.id,
    a.start_time,
    a.end_time,
    `${a.patients?.first_name} ${a.patients?.last_name}`,
    a.user_profiles?.full_name,
    a.appointment_types?.name,
    a.status,
    a.internal_note
  ]);

  const csv = [
    header.join(','),
    ...rows.map((r: any[]) => r.map(escapeCsv).join(','))
  ].join('\n');

  return { csv };
}

export async function exportInvoicesCsv(input: DateRangeQuery): Promise<{ csv: string }> {
  const user = await ensureAuthenticatedServer();
  const supabase = await createClient();
  const clinicId = input.clinicId || user.activeClinicId;
  if (!clinicId) throw new Error('ACTIVE_CLINIC_REQUIRED');

  let q = supabase
    .from('invoices')
    .select('*, patients(first_name, last_name)')
    .eq('clinic_id', clinicId)
    .order('issued_date', { ascending: false });

  if (input.from) q = q.gte('issued_date', input.from);
  if (input.to) q = q.lte('issued_date', input.to);

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  const header = ['Number', 'Date', 'Due Date', 'Patient', 'Status', 'Total', 'Paid', 'Due'];
  const rows = data.map((i: any) => [
    i.invoice_number,
    i.issued_date,
    i.due_date,
    `${i.patients?.first_name} ${i.patients?.last_name}`,
    i.status,
    (i.total_cents / 100).toFixed(2),
    (i.amount_paid_cents / 100).toFixed(2),
    (i.balance_due_cents / 100).toFixed(2)
  ]);

  const csv = [
    header.join(','),
    ...rows.map((r: any[]) => r.map(escapeCsv).join(','))
  ].join('\n');

  return { csv };
}

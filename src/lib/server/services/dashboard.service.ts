
import 'server-only';
import { createClient } from '@/lib/server/supabase/server';
import { getActiveClinic } from '@/lib/server/clinic/get-active-clinic';

export async function getDashboardStats() {
  const { clinicId, user } = await getActiveClinic();
  const supabase = await createClient();

  const now = new Date();
  const next7Days = new Date(now);
  next7Days.setDate(now.getDate() + 7);
  
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Parallel queries for efficiency
  const [
    patientsRes,
    appointmentsRes,
    invoicesRes,
    notesRes,
    notificationsRes
  ] = await Promise.all([
    // Active Patients
    supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .is('archived_at', null),
    
    // Appointments Next 7 Days
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .gte('start_time', now.toISOString())
      .lte('start_time', next7Days.toISOString()),

    // Outstanding Invoices (Not paid, not void, balance > 0)
    supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .gt('balance_cents', 0)
      .neq('status', 'void'),

    // Notes Created This Month
    supabase
      .from('clinical_notes')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .gte('created_at', startOfMonth),

    // Unread Notifications for User
    supabase
      .from('staff_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .eq('user_id', user.id)
      .eq('status', 'unread'),
  ]);

  return {
    activePatients: patientsRes.count || 0,
    upcomingAppointments: appointmentsRes.count || 0,
    outstandingInvoices: invoicesRes.count || 0,
    notesThisMonth: notesRes.count || 0,
    unreadNotifications: notificationsRes.count || 0,
  };
}
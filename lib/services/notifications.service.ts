import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { getActiveClinic } from '@/lib/server/clinic/get-active-clinic';

export async function listNotifications() {
  const { clinicId, user } = await getActiveClinic();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('staff_notifications')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data;
}

export async function markNotificationRead(notificationId: string) {
  const { clinicId, user } = await getActiveClinic();
  const supabase = await createClient();

  const { error } = await supabase
    .from('staff_notifications')
    .update({ status: 'read', read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('clinic_id', clinicId)
    .eq('user_id', user.id);

  if (error) throw error;
}
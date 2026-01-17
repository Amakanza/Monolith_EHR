import { ensureAuthenticatedServer } from '@/lib/services/authService';

export async function queueAppointmentReminder(appointmentId: string) {
  // For now, just log - the actual queueing will be implemented in communications module
  console.log(`Would queue reminder for appointment: ${appointmentId}`);
}

export async function listMessageTemplates() {
  const user = await ensureAuthenticatedServer();
  // Placeholder implementation
  return [];
}
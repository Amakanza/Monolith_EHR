import { ensureAuthenticatedServer } from '@/lib/services/authService';

export async function getActiveClinic() {
  const user = await ensureAuthenticatedServer();
  return {
    clinicId: user.activeClinicId || 'default-clinic',
    user
  };
}
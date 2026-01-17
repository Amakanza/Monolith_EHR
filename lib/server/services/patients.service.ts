import { ensureAuthenticatedServer } from '@/lib/services/authService';

export async function listPatients() {
  const user = await ensureAuthenticatedServer();
  // Placeholder implementation
  return [];
}

export async function createPatient() {
  // Placeholder implementation
  return {};
}
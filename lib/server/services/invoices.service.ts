import { ensureAuthenticatedServer } from '@/lib/services/authService';

export async function listInvoices() {
  const user = await ensureAuthenticatedServer();
  // Placeholder implementation
  return [];
}

export async function createInvoice() {
  // Placeholder implementation
  return {};
}
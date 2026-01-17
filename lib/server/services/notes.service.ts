import { ensureAuthenticatedServer } from '@/lib/services/authService';

export async function listNotes() {
  const user = await ensureAuthenticatedServer();
  // Placeholder implementation
  return [];
}

export async function createNote() {
  // Placeholder implementation
  return {};
}
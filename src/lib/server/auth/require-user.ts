
import 'server-only';
import { getUser } from './get-user';
import { redirect } from 'next/navigation';

export async function requireUser() {
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}


import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { User } from '@supabase/supabase-js';

export async function getUser(): Promise<User | null> {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

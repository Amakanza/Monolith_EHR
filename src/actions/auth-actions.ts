
'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function loginAction(formData: FormData) {
  const supabase = createClient();
  const data = Object.fromEntries(formData);
  
  const parsed = authSchema.safeParse(data);
  if (!parsed.success) {
    return { error: 'Invalid input' };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/account');
}

export async function signupAction(formData: FormData) {
  const supabase = createClient();
  const data = Object.fromEntries(formData);
  
  const parsed = authSchema.safeParse(data);
  if (!parsed.success) {
    return { error: 'Invalid input' };
  }

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/account');
}

export async function logoutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

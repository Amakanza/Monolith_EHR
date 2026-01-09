import { createClient } from '@/lib/server/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createClient();
  await supabase.auth.signOut();
  
  // Redirect to login page after logout
  return NextResponse.redirect(new URL('/login', request.url), {
    status: 302,
  });
}

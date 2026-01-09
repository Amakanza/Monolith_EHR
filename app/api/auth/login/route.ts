import { signInWithEmailPassword } from '@/lib/services/authService';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.email || !body.password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const result = await signInWithEmailPassword({
      email: body.email,
      password: body.password,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    // Avoid leaking specific logic errors if necessary, but helpful for dev
    const status = error.message.includes('Invalid login') ? 401 : 500;
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status }
    );
  }
}

import { signOut } from '@/lib/services/authService';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    await signOut();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Logout failed' },
      { status: 500 }
    );
  }
}

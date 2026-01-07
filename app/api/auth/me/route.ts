import { getCurrentUserServer } from '@/lib/services/authService';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUserServer();
    // Return 200 with null user if not authenticated, typical for "me" endpoints
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

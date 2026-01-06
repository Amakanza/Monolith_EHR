import { upsertUserProfile } from '@/lib/services/authService';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const profile = await upsertUserProfile({
      fullName: body.fullName,
      avatarUrl: body.avatarUrl,
    });
    return NextResponse.json({ profile });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: error.message === 'Not authenticated' ? 401 : 500 }
    );
  }
}

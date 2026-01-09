
import { verifyJoinToken, logJoin } from '@/lib/server/services/telehealth.service';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const joinSchema = z.object({
  token: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = joinSchema.parse(body);

    // Verify
    const sessionData = await verifyJoinToken(token);

    // Log
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Fire and forget log to not block
    logJoin({ token, ip, userAgent }).catch(console.error);

    // Return safe data
    return NextResponse.json({
      valid: true,
      appointment: {
        start_time: sessionData.appointments?.start_time,
        patients: sessionData.appointments?.patients,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ valid: false, error: 'Invalid or expired session' }, { status: 400 });
  }
}

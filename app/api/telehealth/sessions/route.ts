
import { createSession, createSessionSchema } from '@/lib/server/services/telehealth.service';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createSessionSchema.parse(body);
    const session = await createSession(parsed.appointmentId);
    return NextResponse.json(session, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

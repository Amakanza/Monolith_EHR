
import { createTelehealthSession, listSessions } from '@/lib/services/telehealthService';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await listSessions({
      clinicId: searchParams.get('clinicId') || undefined,
      clinicianId: searchParams.get('clinicianId') || undefined,
      patientId: searchParams.get('patientId') || undefined,
      status: (searchParams.get('status') as any) || undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined
    });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await createTelehealthSession(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    const status = error.message.includes('ALREADY_EXISTS') ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

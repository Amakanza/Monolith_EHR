
import { listAuditEvents } from '@/lib/services/reportingService';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await listAuditEvents({
      clinicId: searchParams.get('clinicId') || undefined,
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      eventType: searchParams.get('eventType') || undefined,
      actorUserId: searchParams.get('actorUserId') || undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined
    });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

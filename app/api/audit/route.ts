
import { listEvents, listEventsSchema } from '@/lib/server/services/audit.service';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = {
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      entityType: searchParams.get('entityType') || undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 50,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : 0,
    };

    const parsed = listEventsSchema.parse(query);
    const events = await listEvents(parsed);
    return NextResponse.json({ events });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

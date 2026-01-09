
import { listMessages, queueMessage } from '@/lib/services/communicationsService';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = {
      clinicId: searchParams.get('clinicId') || undefined,
      patientId: searchParams.get('patientId') || undefined,
      status: (searchParams.get('status') as any) || undefined,
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined
    };
    const result = await listMessages(query);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await queueMessage(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

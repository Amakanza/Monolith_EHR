
import { createMessageTemplate, listMessageTemplates } from '@/lib/services/communicationsService';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const result = await listMessageTemplates();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await createMessageTemplate(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

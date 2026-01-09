import { listOutboundMessages, createOutboundMessage } from '@/lib/server/services/outbound-messages.service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const messages = await listOutboundMessages();
    return NextResponse.json(messages);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = await createOutboundMessage(body);
    return NextResponse.json(message, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

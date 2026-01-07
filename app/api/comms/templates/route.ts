import { listTemplates, createTemplate } from '@/lib/server/services/message-templates.service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const templates = await listTemplates();
    return NextResponse.json(templates);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const template = await createTemplate(body);
    return NextResponse.json(template, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

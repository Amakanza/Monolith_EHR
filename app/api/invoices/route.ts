
import { createInvoice, listInvoices } from '@/lib/services/billingService';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await listInvoices({
      clinicId: searchParams.get('clinicId') || undefined,
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
    const result = await createInvoice(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

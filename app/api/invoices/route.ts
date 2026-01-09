
import { listInvoices, createInvoice } from '@/lib/server/services/invoices.service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const invoices = await listInvoices();
    return NextResponse.json(invoices);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const invoice = await createInvoice(body);
    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

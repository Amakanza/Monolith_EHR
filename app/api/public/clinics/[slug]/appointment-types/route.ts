
import { listPublicAppointmentTypes } from '@/lib/services/publicBookingService';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const types = await listPublicAppointmentTypes(slug);
    return NextResponse.json({ types });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

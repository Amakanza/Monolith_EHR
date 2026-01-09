
import { getSessionByAppointment } from '@/lib/server/services/telehealth.service';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const { appointmentId } = await params;
    const session = await getSessionByAppointment(appointmentId);
    return NextResponse.json(session || null);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

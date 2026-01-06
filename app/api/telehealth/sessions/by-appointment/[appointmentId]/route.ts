
import { getSessionByAppointment } from '@/lib/services/telehealthService';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const { appointmentId } = await params;
    const result = await getSessionByAppointment(appointmentId);
    // Return 200 even if null (handled by UI)
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

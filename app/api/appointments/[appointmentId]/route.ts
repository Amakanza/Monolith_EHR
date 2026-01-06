
import { getAppointmentById, updateAppointment } from '@/lib/services/appointmentService';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const { appointmentId } = await params;
    const result = await getAppointmentById(appointmentId);
    return NextResponse.json(result);
  } catch (error: any) {
    const status = error.message.includes('NOT_FOUND') ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const { appointmentId } = await params;
    const body = await request.json();
    const result = await updateAppointment(appointmentId, body);
    return NextResponse.json(result);
  } catch (error: any) {
    const status = error.message.includes('OVERLAP') ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

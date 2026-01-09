
import { getAppointmentById, updateAppointment } from '@/lib/services/appointmentService';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getAppointmentById(id);
    return NextResponse.json(result);
  } catch (error: any) {
    const status = error.message.includes('NOT_FOUND') ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = await updateAppointment(id, body);
    return NextResponse.json(result);
  } catch (error: any) {
    const status = error.message.includes('OVERLAP') ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

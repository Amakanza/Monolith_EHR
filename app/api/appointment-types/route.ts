import { listAppointmentTypes } from '@/lib/server/services/appointments.service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const types = await listAppointmentTypes();
    return NextResponse.json(types);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

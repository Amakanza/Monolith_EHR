import { listAppointments, createAppointment } from '@/lib/server/services/appointments.service';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    // Convert strings to Date objects if needed
    const fromDate = start ? (typeof start === 'string' ? new Date(start) : start) : undefined;
    const toDate = end ? (typeof end === 'string' ? new Date(end) : end) : undefined;
    
    const range = fromDate || toDate ? { from: fromDate, to: toDate } : undefined;
    const appointments = await listAppointments(range);
    
    return NextResponse.json(appointments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const appointment = await createAppointment(body);
    return NextResponse.json(appointment, { status: 201 });
  } catch (error: any) {
    const status = error.message === 'Time slot already booked.' ? 409 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
}

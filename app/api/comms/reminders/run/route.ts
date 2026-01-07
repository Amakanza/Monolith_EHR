import { generateAppointmentReminders } from '@/lib/server/services/reminders.service';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const result = await generateAppointmentReminders();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


import { exportAppointmentsCsv } from '@/lib/services/reportingService';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await exportAppointmentsCsv({
      clinicId: searchParams.get('clinicId') || undefined,
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined
    });
    return new NextResponse(result.csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="appointments.csv"'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

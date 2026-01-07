
import { exportPatientsCsv } from '@/lib/services/reportingService';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await exportPatientsCsv({
      clinicId: searchParams.get('clinicId') || undefined,
      includeArchived: searchParams.get('includeArchived') === 'true'
    });
    return new NextResponse(result.csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="patients.csv"'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

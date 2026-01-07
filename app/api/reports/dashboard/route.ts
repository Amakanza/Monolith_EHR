
import { getClinicDashboard } from '@/lib/services/reportingService';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await getClinicDashboard({
      clinicId: searchParams.get('clinicId') || undefined,
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
    });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

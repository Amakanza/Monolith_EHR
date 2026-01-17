import { getActiveClinic, setActiveClinic } from '@/lib/services/clinicService';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const activeClinicId = await getActiveClinic();
    return NextResponse.json({ activeClinicId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.clinicId) {
      return NextResponse.json({ error: 'Clinic ID is required' }, { status: 400 });
    }

    await setActiveClinic(body.clinicId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { getClinicById } from '@/lib/services/clinicService';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('API: getClinicById called for clinic:', id);
    const result = await getClinicById(id);
    console.log('API: getClinicById result:', result);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API: getClinicById error:', error);
    const status = error.message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

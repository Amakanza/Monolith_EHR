
import { getClinicById } from '@/lib/services/clinicService';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getClinicById(id);
    return NextResponse.json(result);
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

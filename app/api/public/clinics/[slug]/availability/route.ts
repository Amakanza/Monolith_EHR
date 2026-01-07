
import { getAvailability } from '@/lib/services/publicBookingService';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const typeId = searchParams.get('typeId');

    if (!date || !typeId) {
      return NextResponse.json({ error: 'Date and Type ID required' }, { status: 400 });
    }

    const slots = await getAvailability(slug, date, typeId);
    return NextResponse.json({ slots });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { createClinic, listMyClinics } from '@/lib/services/clinicService';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await listMyClinics();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const result = await createClinic({
      name: body.name,
      timezone: body.timezone,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

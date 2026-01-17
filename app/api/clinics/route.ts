import { createClinic, listMyClinics } from '@/lib/services/clinicService';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await listMyClinics();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API GET /clinics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // createClinic now returns only a UUID string
    const clinicId = await createClinic({
      name: body.name,
      timezone: body.timezone,
    });
    
    console.log('API: Clinic created successfully with ID:', clinicId);
    return NextResponse.json({ clinicId }, { status: 201 });
  } catch (error: any) {
    console.error('API POST /clinics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
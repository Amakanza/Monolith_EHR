import { listPatients, createPatient } from '@/lib/server/services/patients.service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const patients = await listPatients();
    return NextResponse.json(patients);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const patient = await createPatient(body);
    return NextResponse.json(patient, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

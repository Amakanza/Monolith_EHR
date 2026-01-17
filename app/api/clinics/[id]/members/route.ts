import { addClinicMember, listClinicMembers } from '@/lib/services/clinicService';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await listClinicMembers(id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    if (!body.userId || !body.role) {
      return NextResponse.json({ error: 'User ID and Role are required' }, { status: 400 });
    }

    await addClinicMember({
      clinicId: id,
      userId: body.userId,
      role: body.role,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
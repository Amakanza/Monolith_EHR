import { removeClinicMember, updateClinicMemberRole } from '@/lib/services/clinicService';
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clinicId: string; userId: string }> }
) {
  try {
    const { clinicId, userId } = await params;
    const body = await request.json();
    
    if (!body.role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    await updateClinicMemberRole({
      clinicId,
      userId,
      role: body.role,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ clinicId: string; userId: string }> }
) {
  try {
    const { clinicId, userId } = await params;
    
    await removeClinicMember({
      clinicId,
      userId,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const isConflict = error.message.includes('last owner');
    return NextResponse.json(
      { error: error.message }, 
      { status: isConflict ? 409 : 500 }
    );
  }
}

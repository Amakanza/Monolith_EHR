
import { removeClinicMember, updateClinicMemberRole } from '@/lib/services/clinicService';
import { createSuccessResponse, handleApiError } from '@/src/lib/server/api-response';
import { requireClinicRole } from '@/src/lib/server/auth/clinic-authorization';
import { UpdateMemberRoleSchema, validateRequest } from '@/src/lib/server/validation/schemas';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id, userId } = await params;
    const body = await request.json();
    
    // Validate input
    const validatedData = validateRequest(UpdateMemberRoleSchema, body);
    
    // Check if user has admin permissions to update member roles
    await requireClinicRole(id, ['owner', 'admin']);

    await updateClinicMemberRole({
      clinicId: id,
      userId,
      role: validatedData.role,
    });

    return createSuccessResponse(undefined, 'Member role updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id, userId } = await params;
    
    // Check if user has admin permissions to remove members
    await requireClinicRole(id, ['owner', 'admin']);
    
    await removeClinicMember({
      clinicId: id,
      userId,
    });

    return createSuccessResponse(undefined, 'Member removed successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

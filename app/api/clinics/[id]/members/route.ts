
import { addClinicMember, listClinicMembers, addMemberByEmailOrUserId } from '@/lib/services/clinicService';
import { createSuccessResponse, handleApiError } from '@/src/lib/server/api-response';
import { requireClinicRole } from '@/src/lib/server/auth/clinic-authorization';
import { AddMemberSchema, validateRequest } from '@/src/lib/server/validation/schemas';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if user is a member of this clinic
    await requireClinicRole(id);
    
    const result = await listClinicMembers(id);
    return createSuccessResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Validate input
    const validatedData = validateRequest(AddMemberSchema, body);
    
    // Check if user has admin permissions to add members
    await requireClinicRole(id, ['owner', 'admin']);

    let result;
    
    if (validatedData.userId) {
      // Use existing function for user ID
      await addClinicMember({
        clinicId: id,
        userId: validatedData.userId,
        role: validatedData.role,
      });
      result = { addedBy: 'userId' };
    } else if (validatedData.email) {
      // Use new function for email
      const userInfo = await addMemberByEmailOrUserId(
        id, 
        validatedData.email, 
        validatedData.role
      );
      result = { addedBy: 'email', user: userInfo };
    }

    return createSuccessResponse(result, 'Member added successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

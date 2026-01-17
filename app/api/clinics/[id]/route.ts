
import { getClinicById } from '@/lib/services/clinicService';
import { createSuccessResponse, handleApiError } from '@/src/lib/server/api-response';
import { requireClinicRole } from '@/src/lib/server/auth/clinic-authorization';
import { UpdateClinicSchema, validateRequest } from '@/src/lib/server/validation/schemas';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if user is a member of this clinic
    await requireClinicRole(id);
    
    const result = await getClinicById(id);
    return createSuccessResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Validate input
    const validatedData = validateRequest(UpdateClinicSchema, body);
    
    // Check if user has admin permissions to update clinic
    await requireClinicRole(id, ['owner', 'admin']);
    
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('clinics')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      throw new Error(`Failed to update clinic: ${error.message}`);
    }
    
    return createSuccessResponse(data, 'Clinic updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if user is the owner (only owners can delete clinics)
    await requireClinicRole(id, ['owner']);
    
    const supabase = createClient();
    
    // Soft delete by setting archived_at
    const { error } = await supabase
      .from('clinics')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id);
      
    if (error) {
      throw new Error(`Failed to archive clinic: ${error.message}`);
    }
    
    return createSuccessResponse(undefined, 'Clinic archived successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

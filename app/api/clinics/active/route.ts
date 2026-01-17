import { getActiveClinic, setActiveClinic } from '@/lib/services/clinicService';
import { createSuccessResponse, handleApiError } from '@/src/lib/server/api-response';
import { SetActiveClinicSchema, validateRequest } from '@/src/lib/server/validation/schemas';

export async function GET() {
  try {
    const activeClinicId = await getActiveClinic();
    return createSuccessResponse({ activeClinicId });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = validateRequest(SetActiveClinicSchema, body);

    await setActiveClinic(validatedData.clinicId);
    return createSuccessResponse(undefined, 'Active clinic updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

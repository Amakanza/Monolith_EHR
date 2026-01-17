import { createClinic, listMyClinics } from '@/lib/services/clinicService';
import { createSuccessResponse, handleApiError, ApiErrorWithStatus } from '@/src/lib/server/api-response';
import { CreateClinicSchema, validateRequest } from '@/src/lib/server/validation/schemas';
import { rateLimit } from '@/src/lib/server/rate-limit';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit.standard(request);
    if (rateLimitResult instanceof Response) {
      return rateLimitResult;
    }

    const result = await listMyClinics();
    
    const response = createSuccessResponse(result);
    // Add rate limit headers
    if (rateLimitResult.headers) {
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value as string);
      });
    }
    
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply stricter rate limiting for clinic creation
    const rateLimitResult = rateLimit.strict(request);
    if (rateLimitResult instanceof Response) {
      return rateLimitResult;
    }

    const body = await request.json();
    const validatedData = validateRequest(CreateClinicSchema, body);

    const clinicId = await createClinic({
      name: validatedData.name,
      timezone: validatedData.timezone,
    });
    
    console.log('API: Clinic created successfully with ID:', clinicId);
    const response = createSuccessResponse({ clinicId }, 'Clinic created successfully');
    
    // Add rate limit headers
    if (rateLimitResult.headers) {
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value as string);
      });
    }
    
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
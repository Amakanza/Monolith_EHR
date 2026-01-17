export interface ApiError {
  error: string;
  code?: string;
  statusCode: number;
  details?: any;
}

export interface ApiSuccess<T = any> {
  success: true;
  data?: T;
  message?: string;
}

export class ApiErrorWithStatus extends Error {
  public statusCode: number;
  public code?: string;
  public details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.name = 'ApiErrorWithStatus';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function createErrorResponse(error: string | ApiErrorWithStatus, statusCode?: number, code?: string): Response {
  if (error instanceof ApiErrorWithStatus) {
    return new Response(
      JSON.stringify({
        error: error.message,
        code: error.code,
        statusCode: error.statusCode,
        ...(error.details && { details: error.details })
      }),
      { 
        status: error.statusCode,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const status = statusCode || 500;
  const message = typeof error === 'string' ? error : error.message;
  const errorCode = code;

  return new Response(
    JSON.stringify({
      error: message,
      code: errorCode,
      statusCode: status
    }),
    { 
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

export function createSuccessResponse<T>(data?: T, message?: string): Response {
  return new Response(
    JSON.stringify({
      success: true,
      ...(data !== undefined && { data }),
      ...(message && { message })
    }),
    { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

export function handleApiError(error: unknown): Response {
  console.error('API Error:', error);
  
  if (error instanceof ApiErrorWithStatus) {
    return createErrorResponse(error, error.statusCode, error.code);
  }

  if (error instanceof Error) {
    let statusCode = 500;
    let code: string | undefined;

    if (error.message.includes('Not authenticated') || error.message.includes('Unauthorized')) {
      statusCode = 401;
      code = 'AUTH_REQUIRED';
    } else if (error.message.includes('Access denied') || error.message.includes('permission')) {
      statusCode = 403;
      code = 'ACCESS_DENIED';
    } else if (error.message.includes('not found')) {
      statusCode = 404;
      code = 'NOT_FOUND';
    } else if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      statusCode = 409;
      code = 'CONFLICT';
    } else if (error.message.includes('required') || error.message.includes('missing')) {
      statusCode = 400;
      code = 'VALIDATION_ERROR';
    }

    return createErrorResponse(error.message, statusCode, code);
  }

  return createErrorResponse('Internal server error', 500, 'INTERNAL_ERROR');
}
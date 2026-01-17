import { NextResponse } from 'next/server';

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

/**
 * Creates a standardized error response
 */
export function createErrorResponse(error: string | ApiErrorWithStatus, statusCode?: number, code?: string): NextResponse {
  if (error instanceof ApiErrorWithStatus) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        statusCode: error.statusCode,
        ...(error.details && { details: error.details })
      },
      { status: error.statusCode }
    );
  }

  const status = statusCode || 500;
  return NextResponse.json(
    {
      error: typeof error === 'string' ? error : 'Unknown error',
      statusCode: status,
      ...(code && { code })
    },
    { status }
  );
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(data?: T, message?: string): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({
    success: true,
    ...(data !== undefined && { data }),
    ...(message && { message })
  });
}

/**
 * Handles common API errors and converts them to appropriate responses
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  if (error instanceof ApiErrorWithStatus) {
    return createErrorResponse(error);
  }

  if (error instanceof Error) {
    // Common error patterns
    if (error.message.includes('Not authenticated') || error.message.includes('Unauthorized')) {
      return createErrorResponse('Authentication required', 401, 'AUTH_REQUIRED');
    }
    
    if (error.message.includes('Access denied') || error.message.includes('permission')) {
      return createErrorResponse('Access denied', 403, 'ACCESS_DENIED');
    }
    
    if (error.message.includes('not found')) {
      return createErrorResponse(error.message, 404, 'NOT_FOUND');
    }
    
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      return createErrorResponse(error.message, 409, 'CONFLICT');
    }
    
    if (error.message.includes('required') || error.message.includes('must be provided')) {
      return createErrorResponse(error.message, 400, 'VALIDATION_ERROR');
    }
    
    if (error.message.includes('last owner')) {
      return createErrorResponse(error.message, 409, 'LAST_OWNER');
    }

    // Generic server error
    return createErrorResponse('Internal server error', 500, 'INTERNAL_ERROR');
  }

  // Unknown error type
  return createErrorResponse('An unexpected error occurred', 500, 'UNKNOWN_ERROR');
}

/**
 * Common HTTP status codes for reference
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Common error codes
 */
export const ERROR_CODES = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  ACCESS_DENIED: 'ACCESS_DENIED',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  LAST_OWNER: 'LAST_OWNER',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
} as const;
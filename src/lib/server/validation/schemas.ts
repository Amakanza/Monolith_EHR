import { z } from 'zod';
import { ClinicRole } from '@/lib/types/clinics';

/**
 * Common schemas
 */
export const UuidSchema = z.string().uuid('Invalid ID format');

/**
 * Clinic-related schemas
 */
export const CreateClinicSchema = z.object({
  name: z.string()
    .min(1, 'Clinic name is required')
    .max(100, 'Clinic name must be less than 100 characters')
    .trim(),
  timezone: z.string()
    .min(1, 'Timezone is required')
    .max(50, 'Timezone must be less than 50 characters')
    .optional(),
});

export const UpdateClinicSchema = z.object({
  name: z.string()
    .min(1, 'Clinic name is required')
    .max(100, 'Clinic name must be less than 100 characters')
    .trim()
    .optional(),
  timezone: z.string()
    .min(1, 'Timezone is required')
    .max(50, 'Timezone must be less than 50 characters')
    .optional(),
  archived_at: z.string().datetime().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

/**
 * Active clinic schema
 */
export const SetActiveClinicSchema = z.object({
  clinicId: UuidSchema,
});

/**
 * Member management schemas
 */
export const AddMemberSchema = z.object({
  userId: UuidSchema.optional(),
  email: z.string().email('Invalid email format').optional(),
  role: z.enum(['owner', 'admin', 'clinician', 'receptionist'] as const)
}).refine(data => data.userId || data.email, {
  message: "Either userId or email must be provided"
}).refine(data => !(data.userId && data.email), {
  message: "Provide either userId or email, not both"
});

export const UpdateMemberRoleSchema = z.object({
  role: z.enum(['owner', 'admin', 'clinician', 'receptionist'] as const),
});

/**
 * User search schema
 */
export const UserSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100, 'Search query too long'),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

/**
 * Pagination schema
 */
export const PaginationSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Request validation helper
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));
      throw new Error(`Validation failed: ${fieldErrors.map(f => `${f.field}: ${f.message}`).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Query parameter validation helper
 */
export function validateQuery<T>(schema: z.ZodSchema<T>, searchParams: URLSearchParams): T {
  const params: Record<string, any> = {};
  
  // Convert URLSearchParams to plain object
  for (const [key, value] of searchParams.entries()) {
    // Handle arrays (e.g., ?tags=a&tags=b)
    if (params[key]) {
      if (Array.isArray(params[key])) {
        params[key].push(value);
      } else {
        params[key] = [params[key], value];
      }
    } else {
      // Try to parse as JSON first, then as number, then as string
      try {
        params[key] = JSON.parse(value);
      } catch {
        const numValue = Number(value);
        params[key] = isNaN(numValue) ? value : numValue;
      }
    }
  }
  
  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));
      throw new Error(`Query validation failed: ${fieldErrors.map(f => `${f.field}: ${f.message}`).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Type exports for use in API routes
 */
export type CreateClinicRequest = z.infer<typeof CreateClinicSchema>;
export type UpdateClinicRequest = z.infer<typeof UpdateClinicSchema>;
export type SetActiveClinicRequest = z.infer<typeof SetActiveClinicSchema>;
export type AddMemberRequest = z.infer<typeof AddMemberSchema>;
export type UpdateMemberRoleRequest = z.infer<typeof UpdateMemberRoleSchema>;
export type UserSearchRequest = z.infer<typeof UserSearchSchema>;
export type PaginationRequest = z.infer<typeof PaginationSchema>;
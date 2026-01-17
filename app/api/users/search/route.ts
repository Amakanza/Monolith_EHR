import { createSuccessResponse, handleApiError } from '@/src/lib/server/api-response';
import { UserSearchSchema, validateQuery } from '@/src/lib/server/validation/schemas';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const validatedData = validateQuery(UserSearchSchema, searchParams);
    
    const supabase = createClient();
    
    // Search users by email or full_name
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, full_name')
      .or(`full_name.ilike.%${validatedData.query}%,id.ilike.%${validatedData.query}%`)
      .limit(validatedData.limit || 10)
      .order('full_name', { ascending: true });
      
    if (error) {
      throw new Error(`Failed to search users: ${error.message}`);
    }
    
    return createSuccessResponse({ users: data || [] });
  } catch (error) {
    return handleApiError(error);
  }
}
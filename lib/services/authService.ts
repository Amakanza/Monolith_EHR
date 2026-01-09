import { createClient as createServerClient } from '@/lib/supabase/server';
import { CurrentUser, GlobalRole, UserProfile } from '@/lib/types/auth';
import { redirect } from 'next/navigation';

/**
 * Maps DB profile and Auth user to CurrentUser domain object
 */
function mapToCurrentUser(authUser: any, profile: any): CurrentUser {
  return {
    id: authUser.id,
    email: authUser.email!,
    fullName: profile?.full_name ?? null,
    globalRole: (profile?.global_role as GlobalRole) ?? 'standard_user',
    avatarUrl: profile?.avatar_url ?? null,
    activeClinicId: profile?.active_clinic_id ?? null,
  };
}

export async function signUpWithEmailPassword(input: {
  email: string;
  password: string;
  fullName?: string;
}): Promise<{ user: CurrentUser }> {
  const supabase = await createServerClient();

  // 1. Create Auth User
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
  });

  if (authError) throw new Error(authError.message);
  if (!authData.user) throw new Error('User creation failed');

  // 2. Create Profile
  // We use upsert to handle cases where a trigger might have already created a row,
  // though manual creation here ensures we can set the fullName immediately.
  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .upsert({
      id: authData.user.id,
      full_name: input.fullName ?? null,
      global_role: 'standard_user',
    })
    .select()
    .single();

  if (profileError) {
    // Cleanup auth user if profile creation fails (manual transaction)
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw new Error('Failed to create user profile: ' + profileError.message);
  }

  return { user: mapToCurrentUser(authData.user, profileData) };
}

export async function signInWithEmailPassword(input: {
  email: string;
  password: string;
}): Promise<{ user: CurrentUser }> {
  const supabase = await createServerClient();

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (authError) throw new Error(authError.message);
  if (!authData.user) throw new Error('Login failed');

  // Fetch Profile
  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError) throw new Error('Failed to fetch user profile');

  return { user: mapToCurrentUser(authData.user, profileData) };
}

export async function signOut(): Promise<void> {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
}

export async function getCurrentUserServer(): Promise<CurrentUser | null> {
  const supabase = await createServerClient();
  
  try {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) return null;

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError) return null;

    return mapToCurrentUser(authUser, profile);
  } catch (error) {
    return null;
  }
}

/**
 * Server-side Guard: Throws redirect if not authenticated
 */
export async function ensureAuthenticatedServer(): Promise<CurrentUser> {
  const user = await getCurrentUserServer();
  if (!user) {
    redirect('/auth/login');
  }
  return user;
}

export async function upsertUserProfile(input: {
  fullName?: string;
  avatarUrl?: string;
}): Promise<UserProfile> {
  const supabase = await createServerClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) throw new Error('Not authenticated');

  const updates: any = {
    updated_at: new Date().toISOString(),
  };
  if (input.fullName !== undefined) updates.full_name = input.fullName;
  if (input.avatarUrl !== undefined) updates.avatar_url = input.avatarUrl;

  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', authUser.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    fullName: data.full_name,
    globalRole: data.global_role,
    avatarUrl: data.avatar_url,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    activeClinicId: data.active_clinic_id,
  };
}

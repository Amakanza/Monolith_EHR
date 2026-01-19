import { createClient as createServerClient } from '@/lib/server/supabase/server';
import { CurrentUser, GlobalRole, AppUserProfile, AppMe, mapDbUserProfileToApp } from '@/lib/types/auth';
import { dbToAppProfile, appToDbProfile } from '@/lib/mappers/userProfile';
import { redirect } from 'next/navigation';

/**
 * Maps DB profile and Auth user to CurrentUser domain object
 */
function mapToCurrentUser(authUser: any, profile: any): CurrentUser {
  // Use the centralized mapper for consistency
  const appProfile = profile ? dbToAppProfile(profile) : {
    id: authUser.id,
    fullName: null,
    globalRole: 'standard_user' as GlobalRole,
    avatarUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    activeClinicId: null,
  };

  return {
    id: authUser.id,
    email: authUser.email!,
    fullName: appProfile.fullName,
    globalRole: appProfile.globalRole,
    avatarUrl: appProfile.avatarUrl,
    activeClinicId: appProfile.activeClinicId,
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
    redirect('/login');
  }
  return user;
}

export async function upsertUserProfile(input: {
  fullName?: string;
  avatarUrl?: string;
}): Promise<AppUserProfile> {
  const supabase = await createServerClient();
const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) throw new Error('Not authenticated');

  // Use centralized mapper for database updates
  const updates = appToDbProfile({
    ...input,
    updatedAt: new Date().toISOString(),
  });

  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', authUser.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Return AppUserProfile using centralized mapper
  return dbToAppProfile(data);
}

export async function getMeServer(): Promise<AppMe> {
  const supabase = await createServerClient();
  
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !authUser) {
    throw new Error('Not authenticated');
  }

  // Fetch user profile from database
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (profileError) {
    // If profile doesn't exist, create a minimal default
    const { data: newProfile, error: createError } = await supabase
      .from('user_profiles')
      .insert({
        id: authUser.id,
        full_name: null,
        global_role: 'standard_user',
        avatar_url: null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create user profile: ${createError.message}`);
    }

    return {
      auth: { id: authUser.id, email: authUser.email ?? null },
      profile: mapDbUserProfileToApp(newProfile),
    };
  }

  return {
    auth: { id: authUser.id, email: authUser.email ?? null },
    profile: mapDbUserProfileToApp(profile),
  };
}

import { requireUser } from '@/lib/server/auth/require-user';
import { createClient } from '@/lib/server/supabase/server';
import { UserProfile } from '@/lib/types/auth';

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = createClient();

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const userProfile = profile ? {
    id: profile.id,
    fullName: profile.full_name,
    globalRole: profile.global_role,
    avatarUrl: profile.avatar_url,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
    activeClinicId: profile.active_clinic_id,
  } as unknown as UserProfile : null;

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome to your secure practice management dashboard.</p>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">My Profile</h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Full Name</dt>
            <dd className="mt-1 text-sm text-gray-900">{userProfile?.full_name || 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">User ID</dt>
            <dd className="mt-1 text-xs font-mono text-gray-900">{user.id}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Active Clinic</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {userProfile?.activeClinicId ? (
                <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  {userProfile.activeClinicId}
                </span>
              ) : (
                <span className="text-gray-400 italic">None</span>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

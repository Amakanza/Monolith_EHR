import { getCurrentUserServer } from '@/lib/services/authService';

export default async function DashboardPage() {
  const user = await getCurrentUserServer();
  
  if (!user) {
    // During static generation, return a minimal dashboard
    return (
      <div className="space-y-6">
        <div className="rounded-lg bg-white p-6 shadow">
          <h1 className="text-2xl font-bold text-gray-900">Practice Management Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome to your secure practice management system.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome to your secure practice management dashboard.
        </p>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">My Profile</h2>

<dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Full Name</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {user.fullName || 'Not set'}
            </dd>
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
              {user.activeClinicId ? (
                <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  {user.activeClinicId}
                </span>
              ) : (
                <span className="italic text-gray-400">None</span>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

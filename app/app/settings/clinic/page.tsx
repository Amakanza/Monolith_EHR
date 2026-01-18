import { requireClinic } from '@/lib/server/clinic/require-clinic';

export default async function ClinicSettingsPage() {
  const { clinic, membership } = await requireClinic();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Clinic Settings</h1>
        <p className="text-gray-500">Manage your clinic workspace.</p>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Clinic Details</h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Name</dt>
            <dd className="mt-1 text-sm text-gray-900">{clinic.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Slug (URL)</dt>
            <dd className="mt-1 text-sm text-gray-900">{clinic.slug}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Your Role</dt>
            <dd className="mt-1 text-sm text-gray-900 capitalize">{membership.role}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Created At</dt>
            <dd className="mt-1 text-sm text-gray-900">{new Date(clinic.createdAt).toLocaleDateString()}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
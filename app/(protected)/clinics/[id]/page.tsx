
'use client';

import React, { useEffect, useState } from 'react';
import { Clinic, ClinicRole } from '@/lib/types/clinics';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ClinicDashboard() {
  const params = useParams();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [myRole, setMyRole] = useState<ClinicRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Use id
  const clinicId = params?.id as string;

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/clinics/${clinicId}`);
        if (res.ok) {
          const data = await res.json();
          setClinic(data.clinic);
          setMyRole(data.myRole);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (clinicId) load();
  }, [clinicId]);

  if (loading) return <div className="p-8">Loading clinic details...</div>;
  if (!clinic) return <div className="p-8">Clinic not found.</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white shadow sm:rounded-lg px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{clinic.name}</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Role: <span className="font-medium text-indigo-600 uppercase">{myRole}</span> • Timezone: {clinic.timezone}
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/clinics/${clinic.id}/members`}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Manage Members
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Placeholder for future modules */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">Patients</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">0</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="font-medium text-gray-500">Module coming soon</span>
            </div>
          </div>
        </div>
        
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">Appointments Today</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">0</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="font-medium text-gray-500">Module coming soon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

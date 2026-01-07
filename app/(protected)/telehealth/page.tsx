
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { TelehealthSession } from '@/lib/types/telehealth';

export default function TelehealthSessionsPage() {
  const { user } = useCurrentUser();
  const [sessions, setSessions] = useState<TelehealthSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user?.activeClinicId) return;
      setLoading(true);
      const res = await fetch(`/api/telehealth/sessions?clinicId=${user.activeClinicId}`);
      if (res.ok) {
        setSessions((await res.json()).sessions);
      }
      setLoading(false);
    }
    load();
  }, [user?.activeClinicId]);

  if (!user?.activeClinicId) return <div className="p-8">Select a clinic first.</div>;

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Telehealth Sessions</h1>
          <p className="mt-1 text-sm text-gray-500">Manage video call links for appointments.</p>
        </div>
        <Link
          href="/telehealth/new"
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          Create Session
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {loading ? <li className="p-4 text-center">Loading...</li> : 
           sessions.length === 0 ? <li className="p-4 text-center text-gray-500">No sessions found.</li> :
           sessions.map(sess => (
            <li key={sess.id}>
              <Link href={`/telehealth/${sess.id}`} className="block hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-indigo-600">
                        {sess.patientName || 'Unknown Patient'} <span className="text-gray-500">with {sess.clinicianName}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Appt: {new Date(sess.appointmentStartTime!).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Provider: {sess.provider.toUpperCase()}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${sess.status === 'live' ? 'bg-red-100 text-red-800' : 
                          sess.status === 'scheduled' ? 'bg-green-100 text-green-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {sess.status.toUpperCase()}
                      </span>
                      <svg className="h-5 w-5 text-gray-400 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

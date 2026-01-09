
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function AppointmentTelehealthPage() {
  const { id: appointmentId } = useParams() as { id: string };
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchSession();
  }, [appointmentId]);

  async function fetchSession() {
    try {
      const res = await fetch(`/api/telehealth/sessions/by-appointment/${appointmentId}`);
      if (res.ok) {
        const data = await res.json();
        setSession(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch('/api/telehealth/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId }),
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data);
      } else {
        alert('Failed to create session');
      }
    } finally {
      setCreating(false);
    }
  }

  function getJoinLink() {
    if (!session) return '';
    return `${window.location.origin}/telehealth/join/${session.join_token}`;
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/appointments" className="text-sm font-medium text-gray-500 hover:text-gray-900">
          ← Back to Appointments
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Telehealth Session</h1>
        
        {!session ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No active telehealth session for this appointment.</p>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Session Active</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Share the link below with the patient.</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Patient Join Link</label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  readOnly
                  value={getJoinLink()}
                  className="block w-full min-w-0 flex-1 rounded-none rounded-l-md border-gray-300 px-3 py-2 text-sm border bg-gray-50 text-gray-500"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getJoinLink());
                    alert('Copied to clipboard!');
                  }}
                  className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="border-t pt-4">
              <a 
                href={getJoinLink()} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Join as Staff (Test Link) &rarr;
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TelehealthJoinLog, TelehealthSession } from '@/lib/types/telehealth';
import Link from 'next/link';

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [session, setSession] = useState<TelehealthSession | null>(null);
  const [logs, setLogs] = useState<TelehealthJoinLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Use id
  const sessionId = params?.id as string;

  useEffect(() => {
    async function load() {
      if (!sessionId) return;
      const [sRes, lRes] = await Promise.all([
        fetch(`/api/telehealth/sessions/${sessionId}`),
        fetch(`/api/telehealth/sessions/${sessionId}/logs`)
      ]);
      if (sRes.ok) setSession((await sRes.json()).session);
      if (lRes.ok) setLogs((await lRes.json()).logs);
      setLoading(false);
    }
    load();
  }, [sessionId]);

  const updateStatus = async (newStatus: string) => {
    await fetch(`/api/telehealth/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    // Reload
    const res = await fetch(`/api/telehealth/sessions/${sessionId}`);
    setSession((await res.json()).session);
  };

  const copyLink = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard');
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!session) return <div className="p-8">Session not found.</div>;

  const publicLink = `${window.location.origin}/join/${session.patientJoinToken}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-0">
      <div className="mb-6">
        <Link href="/telehealth" className="text-sm text-gray-500 hover:text-gray-900">&larr; Back to Sessions</Link>
        <div className="flex justify-between items-start mt-2">
           <div>
             <h1 className="text-2xl font-bold text-gray-900">Session Details</h1>
             <p className="text-gray-500">{session.patientName} with {session.clinicianName}</p>
           </div>
           <span className={`px-3 py-1 text-sm font-bold rounded-full uppercase ${session.status === 'live' ? 'bg-red-100 text-red-800' : 'bg-gray-100'}`}>
             {session.status}
           </span>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6 space-y-6">
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-medium text-gray-500 uppercase">Appointment Time</label>
               <p className="text-sm font-medium text-gray-900">{new Date(session.appointmentStartTime!).toLocaleString()}</p>
             </div>
             <div>
               <label className="block text-xs font-medium text-gray-500 uppercase">Provider</label>
               <p className="text-sm font-medium text-gray-900">{session.provider}</p>
             </div>
           </div>

           <div className="border-t border-gray-200 pt-4">
             <label className="block text-sm font-medium text-gray-700">Raw Meeting URL (Staff)</label>
             <div className="mt-1 flex rounded-md shadow-sm">
               <input type="text" readOnly value={session.joinUrl} className="flex-1 block w-full rounded-none rounded-l-md border-gray-300 sm:text-sm border p-2 bg-gray-50" />
               <button onClick={() => copyLink(session.joinUrl)} className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm hover:bg-gray-100">
                 Copy
               </button>
               <a href={session.joinUrl} target="_blank" className="ml-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                 Launch
               </a>
             </div>
           </div>

           {session.patientJoinToken && (
             <div className="border-t border-gray-200 pt-4 bg-blue-50 p-4 -mx-6 px-6">
               <label className="block text-sm font-medium text-blue-900">Secure Patient Join Link</label>
               <p className="text-xs text-blue-700 mb-2">Send this link to the patient. It hides the meeting URL until they join.</p>
               <div className="flex rounded-md shadow-sm">
                 <input type="text" readOnly value={publicLink} className="flex-1 block w-full rounded-none rounded-l-md border-blue-300 sm:text-sm border p-2 bg-white" />
                 <button onClick={() => copyLink(publicLink)} className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-blue-300 bg-blue-100 text-blue-700 text-sm hover:bg-blue-200">
                   Copy
                 </button>
               </div>
             </div>
           )}

           <div className="border-t border-gray-200 pt-4 flex gap-4">
              <button onClick={() => updateStatus('live')} className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">Mark Live</button>
              <button onClick={() => updateStatus('ended')} className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700">Mark Ended</button>
              <button onClick={() => updateStatus('cancelled')} className="px-3 py-1 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50">Cancel Session</button>
           </div>
        </div>
      </div>

      <h3 className="text-lg font-medium text-gray-900 mb-4">Join Logs</h3>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {logs.length === 0 ? <li className="p-4 text-sm text-gray-500">No logs yet.</li> : logs.map(log => (
            <li key={log.id} className="px-4 py-3">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {log.actorType === 'patient' ? 'Patient' : `Staff (${log.actorName})`}
                  </p>
                  <p className="text-xs text-gray-500">{new Date(log.joinedAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {log.status}
                  </span>
                  {log.error && <p className="text-xs text-red-600 mt-1">{log.error}</p>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

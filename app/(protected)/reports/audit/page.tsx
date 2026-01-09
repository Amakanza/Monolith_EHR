
'use client';

import React, { useEffect, useState } from 'react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { AuditEvent } from '@/lib/types/reporting';
import Link from 'next/link';

export default function AuditLogPage() {
  const { user } = useCurrentUser();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventType, setEventType] = useState('');

  useEffect(() => {
    async function load() {
      if (!user?.activeClinicId) return;
      setLoading(true);
      const params = new URLSearchParams();
      params.set('clinicId', user.activeClinicId);
      if (eventType) params.set('eventType', eventType);
      
      const res = await fetch(`/api/reports/audit?${params.toString()}`);
      if (res.ok) {
        setEvents((await res.json()).events);
      }
      setLoading(false);
    }
    load();
  }, [user?.activeClinicId, eventType]);

  if (!user?.activeClinicId) return <div className="p-8">Select a clinic.</div>;

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <div>
           <Link href="/reports/dashboard" className="text-sm text-gray-500 hover:text-gray-900">&larr; Back to Dashboard</Link>
           <h1 className="text-2xl font-bold text-gray-900 mt-2">Activity Log</h1>
        </div>
        <div>
           <select value={eventType} onChange={e => setEventType(e.target.value)} className="block w-48 rounded-md border-gray-300 shadow-sm sm:text-sm border p-2">
             <option value="">All Events</option>
             <option value="patient.created">Patient Created</option>
             <option value="appointment.created">Appt Created</option>
             <option value="invoice.created">Invoice Created</option>
             <option value="payment.received">Payment Received</option>
             <option value="note.finalized">Note Finalized</option>
           </select>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <ul className="divide-y divide-gray-200">
          {loading ? <li className="p-4 text-center">Loading...</li> : 
           events.length === 0 ? <li className="p-4 text-center text-gray-500">No activity recorded.</li> :
           events.map(ev => (
            <li key={ev.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
              <div className="flex justify-between">
                 <div className="text-sm">
                    <span className="font-medium text-gray-900">{ev.actorName}</span>
                    <span className="text-gray-500"> {ev.eventType} </span>
                    <span className="text-gray-600 font-mono text-xs bg-gray-100 px-1 rounded">{ev.entityType}:{ev.entityId?.slice(0,8)}</span>
                 </div>
                 <div className="text-xs text-gray-500">
                    {new Date(ev.createdAt).toLocaleString()}
                 </div>
              </div>
              <div className="mt-1 text-xs text-gray-400 font-mono truncate">
                 {JSON.stringify(ev.metadata)}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

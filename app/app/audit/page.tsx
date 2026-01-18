
'use client';

import { useState, useEffect } from 'react';

export default function AuditPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [entityType, setEntityType] = useState('');
  const [days, setDays] = useState('7');

  async function fetchAudit() {
    setLoading(true);
    const params = new URLSearchParams();
    if (entityType) params.set('entityType', entityType);
    
    // Calculate date range
    const from = new Date();
    from.setDate(from.getDate() - parseInt(days));
    params.set('from', from.toISOString());

    try {
      const res = await fetch(`/api/audit?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAudit();
  }, [entityType, days]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500">Track system activity and changes.</p>
      </div>

      <div className="flex gap-4 items-center bg-gray-50 p-4 rounded-lg border">
        <div>
          <label className="block text-xs font-medium text-gray-700">Filter by Type</label>
          <select 
            value={entityType} 
            onChange={e => setEntityType(e.target.value)} 
            className="mt-1 block w-40 rounded-md border-gray-300 shadow-sm border p-1 text-sm"
          >
            <option value="">All Types</option>
            <option value="patient">Patient</option>
            <option value="appointment">Appointment</option>
            <option value="clinical_note">Note</option>
            <option value="invoice">Invoice</option>
            <option value="outbound_message">Message</option>
            <option value="telehealth_session">Telehealth</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Time Range</label>
          <select 
            value={days} 
            onChange={e => setDays(e.target.value)} 
            className="mt-1 block w-40 rounded-md border-gray-300 shadow-sm border p-1 text-sm"
          >
            <option value="1">Last 24 Hours</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
        </div>
        <button onClick={fetchAudit} className="mt-5 text-sm text-blue-600 hover:underline">Refresh</button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : events.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No events found.</td></tr>
            ) : (
              events.map((ev: any) => (
                <tr key={ev.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(ev.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ev.actorName || 'System/Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 capitalize">
                      {ev.event_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ev.entity_type} <span className="text-xs text-gray-400">({ev.entity_id?.slice(0, 8)})</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate font-mono text-xs">
                    {JSON.stringify(ev.metadata)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { AppointmentType } from '@/lib/types/appointments';

export default function AppointmentTypesPage() {
  const { user } = useCurrentUser();
  const [types, setTypes] = useState<AppointmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Create Form State
  const [newName, setNewName] = useState('');
  const [newDuration, setNewDuration] = useState(30);
  const [newColor, setNewColor] = useState('#4F46E5');

  const fetchTypes = async () => {
     if (!user?.activeClinicId) return;
     const res = await fetch('/api/appointment-types?includeInactive=true');
     if (res.ok) setTypes((await res.json()).appointmentTypes);
     setLoading(false);
  };

  useEffect(() => {
    fetchTypes();
  }, [user?.activeClinicId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.activeClinicId) return;

    await fetch('/api/appointment-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinicId: user.activeClinicId,
        name: newName,
        defaultDurationMinutes: newDuration,
        color: newColor
      })
    });
    
    setNewName('');
    setShowForm(false);
    fetchTypes();
  };

  if (!user?.activeClinicId) return <div className="p-8">Select a clinic.</div>;

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <div>
           <Link href="/appointments" className="text-sm text-gray-500 hover:text-gray-900">&larr; Back to Schedule</Link>
           <h1 className="text-2xl font-bold text-gray-900 mt-2">Appointment Types</h1>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          {showForm ? 'Cancel' : 'Add New Type'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-md mb-6 border border-gray-200 flex gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-700">Name</label>
            <input required value={newName} onChange={e => setNewName(e.target.value)} className="mt-1 block rounded-md border-gray-300 shadow-sm p-2 text-sm" placeholder="e.g. Initial Cons." />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Duration (mins)</label>
            <input type="number" required value={newDuration} onChange={e => setNewDuration(parseInt(e.target.value))} className="mt-1 w-24 block rounded-md border-gray-300 shadow-sm p-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Color</label>
            <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="mt-1 w-16 h-9 block rounded-md border-gray-300 shadow-sm p-1" />
          </div>
          <button type="submit" className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">Save</button>
        </form>
      )}

      {loading ? <div>Loading...</div> : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {types.map(t => (
              <li key={t.id} className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: t.color || '#ccc' }}></span>
                  <span className="text-sm font-medium text-gray-900">{t.name}</span>
                  <span className="ml-2 text-sm text-gray-500">({t.defaultDurationMinutes} mins)</span>
                  {!t.isActive && <span className="ml-2 px-2 py-0.5 rounded bg-gray-100 text-xs text-gray-500">Inactive</span>}
                </div>
              </li>
            ))}
            {types.length === 0 && <li className="px-4 py-8 text-center text-gray-500 text-sm">No types defined.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}


'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Appointment } from '@/lib/types/appointments';
import { ClinicMemberProfile } from '@/lib/types/clinics';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

export default function EditAppointmentPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useCurrentUser();
  
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [clinicians, setClinicians] = useState<ClinicMemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [clinicianId, setClinicianId] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/appointments/${params.appointmentId}`);
      if (!res.ok) {
        setError('Failed to load appointment');
        setLoading(false);
        return;
      }
      const data = await res.json();
      const a = data.appointment;
      setAppt(a);
      
      // Init form
      const start = new Date(a.startTime);
      const end = new Date(a.endTime);
      setDate(start.toISOString().split('T')[0]);
      setTime(start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}));
      setDuration((end.getTime() - start.getTime()) / 60000);
      setClinicianId(a.clinicianId);
      setNote(a.internalNote || '');

      // Load Clinicians
      if (user?.activeClinicId) {
        const cRes = await fetch(`/api/clinics/${user.activeClinicId}/members`);
        if (cRes.ok) setClinicians((await cRes.json()).members);
      }
      setLoading(false);
    }
    load();
  }, [params.appointmentId, user?.activeClinicId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (appt?.status !== 'booked') {
      setError('Only booked appointments can be rescheduled.');
      return;
    }

    const startDateTime = new Date(`${date}T${time}`);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

    try {
      const res = await fetch(`/api/appointments/${params.appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicianId,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          internalNote: note
        }),
      });

      if (!res.ok) throw new Error((await res.json()).error);
      
      router.push(`/appointments/${params.appointmentId}`);
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!appt) return <div className="p-8">Not found</div>;

  return (
    <div className="max-w-xl mx-auto px-4 py-6 sm:px-0">
      <div className="mb-6">
         <Link href={`/appointments/${params.appointmentId}`} className="text-sm text-gray-500 hover:text-gray-900">&larr; Cancel Edit</Link>
         <h1 className="text-2xl font-bold text-gray-900 mt-2">Reschedule Appointment</h1>
      </div>

      {error && <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white shadow sm:rounded-lg p-6 space-y-6">
        <div>
           <label className="block text-sm font-medium text-gray-700">Clinician</label>
           <select 
             required 
             value={clinicianId} 
             onChange={e => setClinicianId(e.target.value)} 
             className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
           >
             {clinicians.map(c => (
               <option key={c.userId} value={c.userId}>{c.fullName}</option>
             ))}
           </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
             <label className="block text-sm font-medium text-gray-700">Date</label>
             <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700">Start Time</label>
             <input type="time" required value={time} onChange={e => setTime(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
          </div>
        </div>

        <div>
             <label className="block text-sm font-medium text-gray-700">Duration (mins)</label>
             <input type="number" required min="5" step="5" value={duration} onChange={e => setDuration(parseInt(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Internal Note</label>
          <textarea rows={2} value={note} onChange={e => setNote(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
        </div>

        <div className="flex justify-end pt-4">
           <button type="submit" className="py-2 px-4 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700">
             Save Changes
           </button>
        </div>
      </form>
    </div>
  );
}

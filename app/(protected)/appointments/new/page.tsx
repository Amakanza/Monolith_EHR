
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { AppointmentType } from '@/lib/types/appointments';
import { ClinicMemberProfile } from '@/lib/types/clinics';
import { Patient } from '@/lib/types/patients';
import Link from 'next/link';

export default function NewAppointmentPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  
  // Data Sources
  const [types, setTypes] = useState<AppointmentType[]>([]);
  const [clinicians, setClinicians] = useState<ClinicMemberProfile[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  
  // Form State
  const [patientId, setPatientId] = useState('');
  const [clinicianId, setClinicianId] = useState('');
  const [typeId, setTypeId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState(30);
  const [note, setNote] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch initial data
  useEffect(() => {
    async function init() {
      if (!user?.activeClinicId) return;
      try {
        const [tRes, cRes, pRes] = await Promise.all([
          fetch('/api/appointment-types'),
          fetch(`/api/clinics/${user.activeClinicId}/members`),
          fetch('/api/patients?limit=100') // Basic limit for select dropdown
        ]);

        if (tRes.ok) setTypes((await tRes.json()).appointmentTypes);
        if (cRes.ok) setClinicians((await cRes.json()).members);
        if (pRes.ok) setPatients((await pRes.json()).patients);

      } catch (e) { console.error(e); }
    }
    init();
  }, [user?.activeClinicId]);

  // Update duration when type changes
  useEffect(() => {
    if (typeId) {
      const t = types.find(x => x.id === typeId);
      if (t) setDuration(t.defaultDurationMinutes);
    }
  }, [typeId, types]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Construct Timestamps
    const startDateTime = new Date(`${date}T${time}`);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: user?.activeClinicId,
          patientId,
          clinicianId,
          appointmentTypeId: typeId || undefined,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          internalNote: note
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      router.push('/appointments');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:px-0">
      <div className="mb-6">
        <Link href="/appointments" className="text-sm text-gray-500 hover:text-gray-900">&larr; Back to Appointments</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">New Appointment</h1>
      </div>

      {error && <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white shadow sm:rounded-lg p-6 space-y-6">
        
        {/* Patient */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Patient</label>
          <select 
            required 
            value={patientId} 
            onChange={e => setPatientId(e.target.value)} 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
          >
            <option value="">Select Patient...</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">Only showing first 100 patients. Search coming later.</p>
        </div>

        {/* Clinician */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Clinician</label>
          <select 
            required 
            value={clinicianId} 
            onChange={e => setClinicianId(e.target.value)} 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
          >
            <option value="">Select Clinician...</option>
            {clinicians.map(c => (
              <option key={c.userId} value={c.userId}>{c.fullName} ({c.role})</option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Appointment Type</label>
          <select 
            value={typeId} 
            onChange={e => setTypeId(e.target.value)} 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
          >
            <option value="">None / Custom</option>
            {types.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.defaultDurationMinutes} mins)</option>
            ))}
          </select>
        </div>

        {/* Schedule */}
        <div className="grid grid-cols-3 gap-4">
          <div>
             <label className="block text-sm font-medium text-gray-700">Date</label>
             <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700">Start Time</label>
             <input type="time" required value={time} onChange={e => setTime(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700">Duration (mins)</label>
             <input type="number" required min="5" step="5" value={duration} onChange={e => setDuration(parseInt(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Internal Note</label>
          <textarea rows={2} value={note} onChange={e => setNote(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
        </div>

        <div className="flex justify-end pt-4">
           <Link href="/appointments" className="mr-3 py-2 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</Link>
           <button type="submit" disabled={loading} className="py-2 px-4 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-70">
             {loading ? 'Creating...' : 'Create Appointment'}
           </button>
        </div>

      </form>
    </div>
  );
}

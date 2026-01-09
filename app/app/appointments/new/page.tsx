'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewAppointmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data sources
  const [patients, setPatients] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form State
  const [patientId, setPatientId] = useState('');
  const [typeId, setTypeId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [patientsRes, typesRes] = await Promise.all([
          fetch('/api/patients'), // Assumes listPatients is exposed here or create a route for it
          fetch('/api/appointment-types')
        ]);
        
        if (patientsRes.ok) setPatients(await patientsRes.json());
        if (typesRes.ok) setTypes(await typesRes.json());
      } catch (e) {
        console.error("Failed to load form data", e);
      } finally {
        setLoadingData(false);
      }
    }
    fetchData();
  }, []);

  // Update duration when type changes
  useEffect(() => {
    if (typeId) {
      const type = types.find(t => t.id === typeId);
      if (type) setDuration(type.duration);
    }
  }, [typeId, types]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Calculate start and end times
    const startDateTime = new Date(`${date}T${time}`);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          appointmentTypeId: typeId,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          notes
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to create appointment');
      }

      router.push('/app/appointments');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loadingData) return <div className="p-6">Loading form data...</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/appointments" className="text-sm font-medium text-gray-500 hover:text-gray-900">
          ← Back to Schedule
        </Link>
      </div>
      
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Book Appointment</h1>
        <p className="mt-1 text-sm text-gray-500">Schedule a new session for a patient.</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Patient</label>
          <select
            required
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm border"
          >
            <option value="">Select a patient...</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name}
              </option>
            ))}
          </select>
          {patients.length === 0 && <p className="text-xs text-red-500 mt-1">No patients found. <Link href="/app/patients/new" className="underline">Create one first.</Link></p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Appointment Type</label>
          <select
            value={typeId}
            onChange={(e) => setTypeId(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm border"
          >
            <option value="">Custom / Other</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Time</label>
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm border"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
          <input
            type="number"
            required
            min="5"
            step="5"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="mt-1 block w-full max-w-xs rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm border"
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
          >
            {loading ? 'Booking...' : 'Confirm Booking'}
          </button>
        </div>
      </form>
    </div>
  );
}


'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { Appointment } from '@/lib/types/appointments';
import Link from 'next/link';

export default function NewSessionPage() {
  const { user } = useCurrentUser();
  const router = useRouter();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAppts, setLoadingAppts] = useState(true);

  // Form
  const [appointmentId, setAppointmentId] = useState('');
  const [provider, setProvider] = useState('google_meet');
  const [joinUrl, setJoinUrl] = useState('');
  const [patientJoinEnabled, setPatientJoinEnabled] = useState(true);
  
  useEffect(() => {
    async function loadAppts() {
      if (!user?.activeClinicId) return;
      // Get future booked appointments that don't have sessions yet?
      // For simplicity, fetching recent booked ones.
      // Ideally backend would filter `has_session=false`.
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/appointments?clinicId=${user.activeClinicId}&status=booked&from=${today}`);
      if (res.ok) {
        setAppointments((await res.json()).appointments);
      }
      setLoadingAppts(false);
    }
    loadAppts();
  }, [user?.activeClinicId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/telehealth/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: user?.activeClinicId,
          appointmentId,
          provider,
          joinUrl,
          patientJoinEnabled
        })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }
      
      const { session } = await res.json();
      router.push(`/telehealth/${session.id}`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:px-0">
      <div className="mb-6">
        <Link href="/telehealth" className="text-sm text-gray-500 hover:text-gray-900">&larr; Back</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Create Telehealth Session</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow sm:rounded-lg p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Select Appointment</label>
          {loadingAppts ? <p className="text-sm text-gray-500">Loading appointments...</p> : (
            <select 
              required 
              value={appointmentId} 
              onChange={e => setAppointmentId(e.target.value)} 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
            >
              <option value="">Select...</option>
              {appointments.map(a => (
                <option key={a.id} value={a.id}>
                  {new Date(a.startTime).toLocaleString()} - {a.patientName} ({a.clinicianName})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Provider</label>
            <select 
              value={provider} 
              onChange={e => setProvider(e.target.value)} 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
            >
              <option value="google_meet">Google Meet</option>
              <option value="zoom">Zoom</option>
              <option value="microsoft_teams">Microsoft Teams</option>
              <option value="jitsi">Jitsi</option>
              <option value="custom">Custom Link</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Meeting Link (Join URL)</label>
          <input 
            type="url" 
            required 
            placeholder="https://meet.google.com/..." 
            value={joinUrl} 
            onChange={e => setJoinUrl(e.target.value)} 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" 
          />
          <p className="mt-1 text-xs text-gray-500">Paste the full URL from your provider.</p>
        </div>

        <div className="flex items-center">
          <input
            id="enableToken"
            type="checkbox"
            checked={patientJoinEnabled}
            onChange={e => setPatientJoinEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
          />
          <label htmlFor="enableToken" className="ml-2 block text-sm font-medium text-gray-900">
            Generate Secure Patient Join Link
          </label>
        </div>
        <p className="text-xs text-gray-500 ml-6 -mt-4">
          Creates a unique token URL so the patient doesn't need the raw meeting link immediately.
        </p>

        <div className="flex justify-end pt-4">
           <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-indigo-700">
             {loading ? 'Creating...' : 'Create Session'}
           </button>
        </div>
      </form>
    </div>
  );
}

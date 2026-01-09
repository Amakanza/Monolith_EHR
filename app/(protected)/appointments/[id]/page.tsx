
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Appointment } from '@/lib/types/appointments';
import Link from 'next/link';

export default function AppointmentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Use id
  const appointmentId = params?.id as string;

  useEffect(() => {
    async function load() {
      if (!appointmentId) return;
      const res = await fetch(`/api/appointments/${appointmentId}`);
      if (res.ok) {
        setAppt((await res.json()).appointment);
      }
      setLoading(false);
    }
    load();
  }, [appointmentId]);

  const handleStatusChange = async (action: 'cancel' | 'complete' | 'no-show') => {
    let body = {};
    if (action === 'cancel') {
      const reason = prompt('Reason for cancellation:');
      if (reason === null) return; 
      body = { reason };
    } else {
      if (!confirm(`Mark appointment as ${action}?`)) return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error((await res.json()).error);
      
      // Refresh
      const updated = await fetch(`/api/appointments/${appointmentId}`);
      setAppt((await updated.json()).appointment);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!appt) return <div className="p-8">Appointment not found.</div>;

  const isBooked = appt.status === 'booked';

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:px-0">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/appointments" className="text-sm text-gray-500 hover:text-gray-900">&larr; Back to Schedule</Link>
        <div className="text-sm text-gray-500">ID: {appt.id.slice(0, 8)}...</div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Appointment Details
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {new Date(appt.startTime).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold capitalize
            ${appt.status === 'booked' ? 'bg-blue-100 text-blue-800' : 
              appt.status === 'completed' ? 'bg-green-100 text-green-800' : 
              appt.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {appt.status.replace('_', ' ')}
          </span>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Time</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(appt.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(appt.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Patient</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <Link href={`/patients/${appt.patientId}`} className="text-indigo-600 hover:underline">
                  {appt.patientName}
                </Link>
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Clinician</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{appt.clinicianName}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Type</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{appt.appointmentTypeName || 'Standard'}</dd>
            </div>
            {appt.internalNote && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Internal Note</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">{appt.internalNote}</dd>
              </div>
            )}
            {appt.cancellationReason && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 bg-red-50">
                <dt className="text-sm font-medium text-red-800">Cancellation Reason</dt>
                <dd className="mt-1 text-sm text-red-700 sm:mt-0 sm:col-span-2">{appt.cancellationReason}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        {isBooked && (
          <>
            <Link 
              href={`/appointments/${appt.id}/edit`}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Reschedule / Edit
            </Link>
            <button
              onClick={() => handleStatusChange('complete')}
              disabled={processing}
              className="inline-flex items-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
            >
              Mark Completed
            </button>
            <button
              onClick={() => handleStatusChange('cancel')}
              disabled={processing}
              className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
            >
              Cancel Appointment
            </button>
            <button
              onClick={() => handleStatusChange('no-show')}
              disabled={processing}
              className="inline-flex items-center rounded-md border border-transparent bg-yellow-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-yellow-600 disabled:opacity-50"
            >
              Mark No-Show
            </button>
          </>
        )}
      </div>
    </div>
  );
}

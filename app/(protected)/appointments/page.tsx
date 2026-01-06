
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { Appointment, AppointmentStatus } from '@/lib/types/appointments';
import { ClinicMemberProfile } from '@/lib/types/clinics';

export default function AppointmentsPage() {
  const { user } = useCurrentUser();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clinicians, setClinicians] = useState<ClinicMemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedClinician, setSelectedClinician] = useState('');
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | ''>('');
  
  // Date Range (simple approach: Today + next 7 days default)
  const [fromDate, setFromDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  // Fetch Data
  useEffect(() => {
    async function loadData() {
      if (!user?.activeClinicId) return;
      setLoading(true);

      try {
        // Load clinicians for filter
        const membersRes = await fetch(`/api/clinics/${user.activeClinicId}/members`);
        if (membersRes.ok) {
          const mData = await membersRes.json();
          // Ideally filter by role='clinician', but simplified here
          setClinicians(mData.members); 
        }

        // Build Query
        const params = new URLSearchParams();
        params.set('clinicId', user.activeClinicId);
        params.set('from', new Date(fromDate).toISOString());
        // Set end of 'to' date
        const t = new Date(toDate);
        t.setHours(23, 59, 59, 999);
        params.set('to', t.toISOString());

        if (selectedClinician) params.set('clinicianId', selectedClinician);
        if (filterStatus) params.set('status', filterStatus);

        const appRes = await fetch(`/api/appointments?${params.toString()}`);
        if (appRes.ok) {
          const appData = await appRes.json();
          setAppointments(appData.appointments);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user?.activeClinicId, fromDate, toDate, selectedClinician, filterStatus]);

  // Group by Date Helper
  const groupedAppointments = appointments.reduce((acc, app) => {
    const dateKey = new Date(app.startTime).toLocaleDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(app);
    return acc;
  }, {} as Record<string, Appointment[]>);

  if (!user?.activeClinicId) {
    return <div className="p-8 text-center text-gray-500">Please select a clinic to view appointments.</div>;
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="mt-1 text-sm text-gray-500">Manage schedule for your clinic.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link 
            href="/appointment-types"
            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Manage Types
          </Link>
          <Link
            href="/appointments/new"
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            New Appointment
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-md shadow mb-6 flex flex-wrap gap-4 items-end">
        <div>
           <label className="block text-xs font-medium text-gray-700">From</label>
           <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="mt-1 block rounded-md border-gray-300 shadow-sm sm:text-sm border p-1" />
        </div>
        <div>
           <label className="block text-xs font-medium text-gray-700">To</label>
           <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="mt-1 block rounded-md border-gray-300 shadow-sm sm:text-sm border p-1" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Clinician</label>
          <select 
            value={selectedClinician} 
            onChange={e => setSelectedClinician(e.target.value)} 
            className="mt-1 block w-40 rounded-md border-gray-300 shadow-sm sm:text-sm border p-1"
          >
            <option value="">All Clinicians</option>
            {clinicians.map(c => (
              <option key={c.userId} value={c.userId}>{c.fullName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Status</label>
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value as AppointmentStatus)} 
            className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm sm:text-sm border p-1"
          >
            <option value="">All Statuses</option>
            <option value="booked">Booked</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading schedule...</div>
      ) : Object.keys(groupedAppointments).length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg border border-dashed border-gray-300 text-gray-500">
          No appointments found for this range.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedAppointments).map(([date, apps]) => (
            <div key={date} className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-900">{date}</h3>
              </div>
              <ul className="divide-y divide-gray-200">
                {apps.map((app) => (
                  <li key={app.id}>
                    <Link href={`/appointments/${app.id}`} className="block hover:bg-gray-50">
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-indigo-600 truncate w-32">
                              {new Date(app.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              {' - '}
                              {new Date(app.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-900">{app.patientName}</p>
                              <p className="text-xs text-gray-500">with {app.clinicianName}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                             <StatusBadge status={app.status} />
                             {app.appointmentTypeName && (
                               <span className="mt-1 inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                                 {app.appointmentTypeName}
                               </span>
                             )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: any = {
    booked: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-yellow-100 text-yellow-800',
  };
  return (
    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

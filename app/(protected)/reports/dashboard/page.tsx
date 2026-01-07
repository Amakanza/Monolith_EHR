
'use client';

import React, { useEffect, useState } from 'react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { DashboardMetrics } from '@/lib/types/reporting';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useCurrentUser();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30'); // days

  useEffect(() => {
    async function load() {
      if (!user?.activeClinicId) return;
      setLoading(true);
      
      const from = new Date();
      from.setDate(from.getDate() - parseInt(range));
      
      const res = await fetch(`/api/reports/dashboard?clinicId=${user.activeClinicId}&from=${from.toISOString().split('T')[0]}`);
      if (res.ok) {
        setMetrics((await res.json()).metrics);
      }
      setLoading(false);
    }
    load();
  }, [user?.activeClinicId, range]);

  if (!user?.activeClinicId) return <div className="p-8">Select a clinic.</div>;

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clinic Dashboard</h1>
        <div className="flex gap-2">
           <Link href="/reports/audit" className="text-sm font-medium text-indigo-600 hover:underline px-3 py-2">Activity Log</Link>
           <Link href="/reports/exports" className="text-sm font-medium text-indigo-600 hover:underline px-3 py-2">Exports</Link>
           <select 
             value={range} 
             onChange={e => setRange(e.target.value)} 
             className="block w-32 rounded-md border-gray-300 shadow-sm sm:text-sm border p-2"
           >
             <option value="7">Last 7 Days</option>
             <option value="30">Last 30 Days</option>
             <option value="90">Last 90 Days</option>
           </select>
        </div>
      </div>

      {loading || !metrics ? <div className="text-center py-10">Loading metrics...</div> : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
           {/* Metric Cards */}
           <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Total Active Patients</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{metrics.activePatients}</dd>
                <div className="mt-1 text-sm text-green-600">+{metrics.newPatientsInRange} new in period</div>
              </div>
           </div>

           <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Total Invoiced</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{(metrics.invoicesTotals.totalCents / 100).toFixed(2)}</dd>
                <div className="mt-1 text-xs text-gray-500">
                   Paid: {(metrics.invoicesTotals.paidCents / 100).toFixed(2)} | Due: <span className="text-red-600">{(metrics.invoicesTotals.balanceCents / 100).toFixed(2)}</span>
                </div>
              </div>
           </div>

           <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Appointments</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {Object.values(metrics.appointmentsByStatus).reduce((a, b) => a + b, 0)}
                </dd>
                <div className="mt-1 text-xs text-gray-500 flex gap-2">
                   <span className="text-blue-600">{metrics.appointmentsByStatus.booked} Booked</span>
                   <span className="text-green-600">{metrics.appointmentsByStatus.completed} Done</span>
                </div>
              </div>
           </div>

           <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Clinical Notes</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{metrics.notesCreated}</dd>
                <div className="mt-1 text-sm text-gray-500">Created in period</div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

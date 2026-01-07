
'use client';

import React from 'react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import Link from 'next/link';

export default function ExportsPage() {
  const { user } = useCurrentUser();

  if (!user?.activeClinicId) return <div className="p-8">Select a clinic.</div>;

  const handleDownload = (endpoint: string) => {
    window.open(`/api/exports/${endpoint}?clinicId=${user.activeClinicId}`, '_blank');
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <Link href="/reports/dashboard" className="text-sm text-gray-500 hover:text-gray-900">&larr; Back to Dashboard</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Data Exports</h1>
        <p className="text-gray-500">Download your clinic data in CSV format.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
         <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Patients</h3>
            <p className="mt-2 text-sm text-gray-500">Full list of active patients including contact details and demographics.</p>
            <button 
              onClick={() => handleDownload('patients')}
              className="mt-4 w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 py-2 px-4 rounded-md text-sm font-medium"
            >
              Download CSV
            </button>
         </div>

         <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Appointments</h3>
            <p className="mt-2 text-sm text-gray-500">List of all appointments. Defaults to all time.</p>
            <button 
              onClick={() => handleDownload('appointments')}
              className="mt-4 w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 py-2 px-4 rounded-md text-sm font-medium"
            >
              Download CSV
            </button>
         </div>

         <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Invoices</h3>
            <p className="mt-2 text-sm text-gray-500">Financial records including totals, paid amounts, and status.</p>
            <button 
              onClick={() => handleDownload('invoices')}
              className="mt-4 w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 py-2 px-4 rounded-md text-sm font-medium"
            >
              Download CSV
            </button>
         </div>
      </div>
    </div>
  );
}

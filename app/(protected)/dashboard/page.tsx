import React from 'react';
import { getCurrentUserServer } from '@/lib/services/authService';

export default async function DashboardPage() {
  const user = await getCurrentUserServer();

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="rounded-lg bg-white p-8 shadow">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome back, {user?.fullName || 'User'}!
        </h1>
        <p className="text-gray-600 mb-6">
          This is your main dashboard. Future modules (Appointments, Patients, Clinics) will appear here.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
            <h3 className="font-semibold text-blue-900">Clinics</h3>
            <p className="text-sm text-blue-700 mt-2">Manage your practice locations.</p>
            <span className="inline-block mt-4 text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">Coming Soon</span>
          </div>
          <div className="bg-green-50 p-6 rounded-lg border border-green-100">
            <h3 className="font-semibold text-green-900">Patients</h3>
            <p className="text-sm text-green-700 mt-2">View patient records and history.</p>
            <span className="inline-block mt-4 text-xs bg-green-200 text-green-800 px-2 py-1 rounded">Coming Soon</span>
          </div>
          <div className="bg-purple-50 p-6 rounded-lg border border-purple-100">
            <h3 className="font-semibold text-purple-900">Appointments</h3>
            <p className="text-sm text-purple-700 mt-2">Schedule and manage bookings.</p>
            <span className="inline-block mt-4 text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded">Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}

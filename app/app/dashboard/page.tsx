
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) setStats(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Welcome to your practice management overview.
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading statistics...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Active Patients */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Active Patients</h3>
            <div className="mt-2 flex items-baseline">
              <span className="text-3xl font-semibold text-gray-900">{stats?.activePatients}</span>
            </div>
            <Link href="/app/patients" className="mt-4 block text-sm text-blue-600 hover:underline">
              View Patients &rarr;
            </Link>
          </div>

          {/* Card 2: Upcoming Appointments */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Appointments (7 Days)</h3>
            <div className="mt-2 flex items-baseline">
              <span className="text-3xl font-semibold text-gray-900">{stats?.upcomingAppointments}</span>
            </div>
            <Link href="/app/appointments" className="mt-4 block text-sm text-blue-600 hover:underline">
              View Calendar &rarr;
            </Link>
          </div>

          {/* Card 3: Outstanding Invoices */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Outstanding Invoices</h3>
            <div className="mt-2 flex items-baseline">
              <span className="text-3xl font-semibold text-gray-900">{stats?.outstandingInvoices}</span>
            </div>
            <Link href="/app/billing/invoices" className="mt-4 block text-sm text-blue-600 hover:underline">
              View Billing &rarr;
            </Link>
          </div>

          {/* Card 4: Notes This Month */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Notes (This Month)</h3>
            <div className="mt-2 flex items-baseline">
              <span className="text-3xl font-semibold text-gray-900">{stats?.notesThisMonth}</span>
            </div>
            <p className="mt-4 text-xs text-gray-400">Documentation activity</p>
          </div>
        </div>
      )}

      {/* Additional Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/app/patients/new" className="flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
              Add Patient
            </Link>
            <Link href="/app/appointments/new" className="flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
              Book Appointment
            </Link>
            <Link href="/app/billing/invoices/new" className="flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
              Create Invoice
            </Link>
            <Link href="/app/comms/outbound" className="flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
              Send Message
            </Link>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Unread Notifications</h3>
          {stats?.unreadNotifications > 0 ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold">
                {stats.unreadNotifications}
              </span>
              <span className="text-sm text-gray-600">messages waiting for you.</span>
              <Link href="/app/notifications" className="ml-auto text-sm text-blue-600 hover:underline">
                Go to Inbox
              </Link>
            </div>
          ) : (
            <p className="text-sm text-gray-500">You are all caught up!</p>
          )}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { ensureAuthenticatedServer } from '@/lib/services/authService';
import Link from 'next/link';
import ActiveClinicSwitcher from '@/components/ActiveClinicSwitcher';
import NotificationBell from '@/components/NotificationBell';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await ensureAuthenticatedServer();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <Link href="/account" className="font-bold text-xl text-indigo-600">MediCore</Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/account"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  Dashboard
                </Link>
                <Link
                  href="/clinics"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  Clinics
                </Link>
                <Link
                  href="/communications/messages"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  Messages
                </Link>
                <Link
                  href="/account"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  My Account
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <ActiveClinicSwitcher currentActiveId={user.activeClinicId} />
              
              <NotificationBell />

              <div className="text-sm text-gray-700">
                {user.fullName || user.email}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-10">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
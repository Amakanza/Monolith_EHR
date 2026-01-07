
import { requireUser } from '@/lib/server/auth/require-user';
import Link from 'next/link';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white px-4 py-3 shadow-sm">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/app" className="text-lg font-bold text-blue-600">Monolith EHR</Link>
          <div className="flex items-center gap-6">
            <Link href="/app/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900">Dashboard</Link>
            <Link href="/app/patients" className="text-sm font-medium text-gray-600 hover:text-gray-900">Patients</Link>
            <Link href="/app/appointments" className="text-sm font-medium text-gray-600 hover:text-gray-900">Appointments</Link>
            <Link href="/app/billing/invoices" className="text-sm font-medium text-gray-600 hover:text-gray-900">Billing</Link>
            <div className="relative group">
              <span className="text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-900">Comms</span>
              <div className="absolute hidden group-hover:block bg-white border shadow-lg rounded mt-1 p-2 w-32 z-10">
                <Link href="/app/comms/outbound" className="block text-sm text-gray-700 hover:bg-gray-100 p-1 rounded">Messages</Link>
                <Link href="/app/comms/templates" className="block text-sm text-gray-700 hover:bg-gray-100 p-1 rounded">Templates</Link>
              </div>
            </div>
            <Link href="/app/audit" className="text-sm font-medium text-gray-600 hover:text-gray-900">Audit</Link>
            <form action="/auth/logout" method="POST">
              <button type="submit" className="text-sm font-medium text-red-600 hover:text-red-800">
                Logout
              </button>
            </form>
          </div>
        </div>
      </nav>
      <main className="container mx-auto p-4 md:p-6">{children}</main>
    </div>
  );
}

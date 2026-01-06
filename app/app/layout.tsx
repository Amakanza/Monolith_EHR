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
            <Link href="/app/patients" className="text-sm font-medium text-gray-600 hover:text-gray-900">Patients</Link>
            <Link href="/app/appointments" className="text-sm font-medium text-gray-600 hover:text-gray-900">Appointments</Link>
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

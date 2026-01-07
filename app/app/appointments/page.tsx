import { listAppointments } from '@/lib/server/services/appointments.service';
import Link from 'next/link';

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  
  // Calculate date range based on searchParams or default to next 7 days
  const startDate = params.start ? new Date(params.start) : now;
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 7);

  const appointments = await listAppointments({ from: startDate, to: endDate });

  // Navigation helpers
  const prevWeek = new Date(startDate);
  prevWeek.setDate(startDate.getDate() - 7);
  const nextWeek = new Date(startDate);
  nextWeek.setDate(startDate.getDate() + 7);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Appointments</h1>
          <p className="text-sm text-gray-500">
            Showing appointments for {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
          </p>
        </div>
        <Link 
          href="/app/appointments/new" 
          className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Book Appointment
        </Link>
      </div>

      <div className="flex gap-4">
        <Link 
          href={`/app/appointments?start=${prevWeek.toISOString()}`}
          className="text-sm font-medium text-gray-600 hover:text-gray-900 border rounded px-3 py-1 bg-white"
        >
          ← Previous Week
        </Link>
        <Link 
          href="/app/appointments"
          className="text-sm font-medium text-gray-600 hover:text-gray-900 border rounded px-3 py-1 bg-white"
        >
          Today
        </Link>
        <Link 
          href={`/app/appointments?start=${nextWeek.toISOString()}`}
          className="text-sm font-medium text-gray-600 hover:text-gray-900 border rounded px-3 py-1 bg-white"
        >
          Next Week →
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {appointments.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  No appointments scheduled for this period.
                </td>
              </tr>
            ) : (
              appointments.map((apt: any) => {
                const start = new Date(apt.start_time);
                const end = new Date(apt.end_time);
                const duration = Math.round((end.getTime() - start.getTime()) / 60000);
                
                return (
                  <tr key={apt.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-sm text-gray-500">
                          {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({duration} min)
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {apt.patients?.first_name} {apt.patients?.last_name}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 capitalize">
                        {apt.status || 'booked'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {apt.notes || '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

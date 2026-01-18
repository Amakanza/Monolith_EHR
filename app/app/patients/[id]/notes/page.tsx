import { listNotesForPatient } from '@/lib/server/services/notes.service';
import { getPatientById } from '@/lib/server/services/patients.service';
import Link from 'next/link';

export default async function PatientNotesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: patientId } = await params;
  const patient = await getPatientById(patientId);
  const notes = await listNotesForPatient(patientId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/app/patients/${patientId}`} className="text-sm font-medium text-gray-500 hover:text-gray-900">
            ← Back to Patient
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Clinical Notes: {patient.first_name} {patient.last_name}
          </h1>
        </div>
        <Link 
          href={`/app/patients/${patientId}/notes/new`} 
          className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          New Note
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subjective Preview</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">View</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {notes.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  No notes recorded yet.
                </td>
              </tr>
            ) : (
              notes.map((note: any) => (
                <tr key={note.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(note.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                    {note.subjective || <span className="text-gray-400 italic">Empty</span>}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                      note.status === 'final' 
                        ? 'bg-green-50 text-green-700 ring-green-600/20' 
                        : 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                    }`}>
                      {note.status === 'final' ? 'Finalized' : 'Draft'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <Link href={`/app/notes/${note.id}`} className="text-blue-600 hover:text-blue-900">
                      Open
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ClinicalNote } from '@/lib/types/notes';

export default function PatientNotesPage() {
  const params = useParams();
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Use id
  const patientId = params?.id as string;

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/patients/${patientId}/notes`);
      if (res.ok) {
        setNotes((await res.json()).notes);
      }
      setLoading(false);
    }
    if (patientId) load();
  }, [patientId]);

  if (loading) return <div className="p-8">Loading notes...</div>;

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href={`/patients/${patientId}`} className="text-sm text-gray-500 hover:text-gray-900">&larr; Back to Patient</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Clinical Notes</h1>
        </div>
        <Link
          href={`/patients/${patientId}/notes/new`}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          New Note
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {notes.length === 0 ? (
             <li className="px-4 py-8 text-center text-gray-500 text-sm">No notes recorded for this patient.</li>
          ) : notes.map((note) => (
            <li key={note.id}>
              <Link href={`/notes/${note.id}`} className="block hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-medium text-indigo-600">{note.title}</p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${note.status === 'final' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {note.status === 'final' ? 'Finalized' : 'Draft'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {new Date(note.noteDate).toLocaleDateString()}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        By {note.authorName}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

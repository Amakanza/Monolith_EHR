'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Patient } from '@/lib/types/patients';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

export default function PatientsListPage() {
  const { user } = useCurrentUser();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);

  async function fetchPatients() {
    if (!user?.activeClinicId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (includeArchived) params.set('includeArchived', 'true');

      const res = await fetch(`/api/patients?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPatients();
  }, [user?.activeClinicId, search, includeArchived]);

  if (!user?.activeClinicId) {
    return <div className="p-8 text-center text-gray-500">Please select a clinic to view patients.</div>;
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="mt-2 text-sm text-gray-700">A list of all patients in the current clinic.</p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            href="/patients/new"
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Add Patient
          </Link>
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <input
          type="text"
          placeholder="Search by name, ID, or file number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full max-w-sm rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
        />
        <div className="flex items-center">
           <input
            id="archived"
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => setIncludeArchived(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
          />
          <label htmlFor="archived" className="ml-2 text-sm text-gray-900">Include Archived</label>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">ID / DOB</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Contact</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">File No</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-gray-500">Loading...</td>
                    </tr>
                  ) : patients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-gray-500">No patients found.</td>
                    </tr>
                  ) : (
                    patients.map((patient) => (
                      <tr key={patient.id} className={patient.archivedAt ? 'bg-gray-50 opacity-75' : ''}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {patient.firstName} {patient.lastName}
                          {patient.archivedAt && <span className="ml-2 inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">Archived</span>}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {patient.idNumber || patient.passportNumber || patient.dateOfBirth}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {patient.cellNumber || patient.email}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {patient.fileNumber}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link href={`/patients/${patient.id}`} className="text-indigo-600 hover:text-indigo-900">
                            View<span className="sr-only">, {patient.firstName}</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

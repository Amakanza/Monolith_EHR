
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Patient } from '@/lib/types/patients';
import Link from 'next/link';

export default function EditPatientPage() {
  const router = useRouter();
  const params = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Use id
  const patientId = params?.id as string;

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/patients/${patientId}`);
      if (res.ok) {
        const json = await res.json();
        setPatient(json.patient.patient);
      }
      setLoading(false);
    }
    if (patientId) load();
  }, [patientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/patients/${patient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patient),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      
      router.push(`/patients/${patient.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!patient) return <div className="p-8">Not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-0">
      <div className="mb-6">
        <Link href={`/patients/${patient.id}`} className="text-sm text-gray-500 hover:text-gray-900">&larr; Back to Patient</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Edit Patient Details</h1>
      </div>

      {error && <div className="bg-red-50 p-4 mb-4 text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white shadow sm:rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
           <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input type="text" value={patient.firstName} onChange={e => setPatient({...patient, firstName: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input type="text" value={patient.lastName} onChange={e => setPatient({...patient, lastName: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
            </div>
             <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Dependent Code</label>
              <input type="text" value={patient.dependentCode || ''} onChange={e => setPatient({...patient, dependentCode: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
            </div>
             <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Cell Number</label>
              <input type="text" value={patient.cellNumber || ''} onChange={e => setPatient({...patient, cellNumber: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
            </div>
             <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" value={patient.email || ''} onChange={e => setPatient({...patient, email: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
            </div>
             <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700">Postal Address</label>
              <textarea rows={2} value={patient.postalAddress || ''} onChange={e => setPatient({...patient, postalAddress: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
            </div>
             <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Occupation</label>
              <input type="text" value={patient.occupation || ''} onChange={e => setPatient({...patient, occupation: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
            </div>
        </div>

        <div className="flex justify-end pt-5">
           <Link
              href={`/patients/${patient.id}`}
              className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-70"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
      </form>
    </div>
  );
}

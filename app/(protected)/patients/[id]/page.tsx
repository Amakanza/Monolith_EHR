
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PatientWithMembership } from '@/lib/types/patients';
import Link from 'next/link';

export default function PatientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<PatientWithMembership | null>(null);
  const [loading, setLoading] = useState(true);

  // Use id
  const patientId = params?.id as string;

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/patients/${patientId}`);
        if (res.ok) {
          const json = await res.json();
          setData(json.patient);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (patientId) load();
  }, [patientId]);

  const handleArchive = async () => {
    if (!data) return;
    const action = data.patient.archivedAt ? 'unarchive' : 'archive';
    if (!confirm(`Are you sure you want to ${action} this patient?`)) return;

    await fetch(`/api/patients/${data.patient.id}/${action}`, { method: 'POST' });
    router.refresh();
    window.location.reload();
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!data) return <div className="p-8">Patient not found</div>;

  const { patient, membership } = data;

  return (
    <div className="px-4 py-6 sm:px-0 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
           <Link href="/patients" className="text-sm text-gray-500 hover:text-gray-900">&larr; Back to Patients</Link>
           <h1 className="text-2xl font-bold text-gray-900 mt-2">
             {patient.firstName} {patient.lastName}
             {patient.archivedAt && <span className="ml-3 text-sm bg-red-100 text-red-800 px-2 py-1 rounded">Archived</span>}
           </h1>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleArchive}
            className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            {patient.archivedAt ? 'Unarchive' : 'Archive'}
          </button>
          <Link
            href={`/patients/${patient.id}/edit`}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Edit Patient
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Patient Info */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Personal Information</h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">ID / DOB</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patient.idNumber || patient.dateOfBirth}</dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Dependent Code</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patient.dependentCode || '00'}</dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Contact</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div>Cell: {patient.cellNumber}</div>
                  <div>Email: {patient.email}</div>
                </dd>
              </div>
               <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patient.postalAddress}</dd>
              </div>
               <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Occupation</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patient.occupation}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Membership Info */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Membership / Funding</h3>
            <Link href={`/patients/${patient.id}/membership`} className="text-sm text-indigo-600 hover:text-indigo-900">Edit</Link>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
             <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Funding Type</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 capitalize">{membership?.fundingType || 'None'}</dd>
              </div>
              {membership?.fundingType === 'medical_aid' && (
                <>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Medical Aid</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{membership.medicalAidName} ({membership.medicalAidPlan})</dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Number</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{membership.medicalAidNumber}</dd>
                  </div>
                </>
              )}
               <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Main Member</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {membership?.patientIsMainMember ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Self</span>
                  ) : (
                    <div>
                      <div>{membership?.mainMemberFirstName} {membership?.mainMemberLastName}</div>
                      <div className="text-xs text-gray-500">{membership?.mainMemberEmployer}</div>
                    </div>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

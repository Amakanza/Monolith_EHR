'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import Link from 'next/link';

export default function NewPatientPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [patient, setPatient] = useState({
    firstName: '', lastName: '', dateOfBirth: '', gender: 'unknown',
    idNumber: '', passportNumber: '', dependentCode: '',
    cellNumber: '', telNumber: '', email: '',
    postalAddress: '', addressCity: '', occupation: '', fileNumber: ''
  });

  const [membership, setMembership] = useState({
    fundingType: 'medical_aid',
    medicalAidName: '', medicalAidPlan: '', medicalAidNumber: '',
    patientIsMainMember: true,
    mainMemberFirstName: '', mainMemberLastName: '',
    mainMemberIdNumber: '', mainMemberPassportNumber: '',
    mainMemberCellNumber: '', mainMemberTelNumber: '',
    mainMemberOccupation: '', mainMemberEmployer: '',
    mainMemberEmployerContact: '', mainMemberPostalAddress: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!user?.activeClinicId) throw new Error('No active clinic selected');

      // Basic front-end validation for required dependent code
      if (!membership.patientIsMainMember && !patient.dependentCode) {
         throw new Error('Dependent code is required when patient is not main member');
      }

      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: user.activeClinicId,
          patient,
          membership
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      const { patient: created } = await res.json();
      router.push(`/patients/${created.patient.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user?.activeClinicId) return <div className="p-8">Please select a clinic first.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-0">
      <div className="mb-6">
        <Link href="/patients" className="text-sm text-gray-500 hover:text-gray-900">&larr; Back to Patients</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Add New Patient</h1>
      </div>

      {error && <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200 bg-white p-6 shadow sm:rounded-lg">
        {/* Section 1: Patient Details */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Patient Details</h3>
            <p className="mt-1 text-sm text-gray-500">The person receiving treatment.</p>
          </div>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">First Name *</label>
              <input type="text" required value={patient.firstName} onChange={e => setPatient({...patient, firstName: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Last Name *</label>
              <input type="text" required value={patient.lastName} onChange={e => setPatient({...patient, lastName: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
              <input type="date" value={patient.dateOfBirth} onChange={e => setPatient({...patient, dateOfBirth: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <select value={patient.gender} onChange={e => setPatient({...patient, gender: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
             <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Dependent Code</label>
              <input type="text" placeholder={!membership.patientIsMainMember ? "Required" : "00"} value={patient.dependentCode} onChange={e => setPatient({...patient, dependentCode: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">ID Number</label>
              <input type="text" value={patient.idNumber} onChange={e => setPatient({...patient, idNumber: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Passport Number</label>
              <input type="text" value={patient.passportNumber} onChange={e => setPatient({...patient, passportNumber: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Cell Number</label>
              <input type="tel" value={patient.cellNumber} onChange={e => setPatient({...patient, cellNumber: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Tel Number</label>
              <input type="tel" value={patient.telNumber} onChange={e => setPatient({...patient, telNumber: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
            </div>
             <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" value={patient.email} onChange={e => setPatient({...patient, email: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
            </div>

            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700">Postal Address *</label>
              <textarea rows={2} required value={patient.postalAddress} onChange={e => setPatient({...patient, postalAddress: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
            </div>

             <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Occupation *</label>
              <input type="text" required value={patient.occupation} onChange={e => setPatient({...patient, occupation: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
            </div>
             <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">File Number</label>
              <input type="text" value={patient.fileNumber} onChange={e => setPatient({...patient, fileNumber: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
            </div>
          </div>
        </div>

        {/* Section 2: Membership & Main Member */}
        <div className="pt-8 space-y-6">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Membership & Funding</h3>
            <p className="mt-1 text-sm text-gray-500">Medical aid and main member details.</p>
          </div>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-6 flex items-center">
              <input
                id="isMainMember"
                type="checkbox"
                checked={membership.patientIsMainMember}
                onChange={e => setMembership({...membership, patientIsMainMember: e.target.checked})}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
              />
              <label htmlFor="isMainMember" className="ml-2 block text-sm font-medium text-gray-900">
                Patient is the Main Member / Policy Holder
              </label>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Funding Type</label>
              <select value={membership.fundingType} onChange={e => setMembership({...membership, fundingType: e.target.value as any})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border">
                <option value="medical_aid">Medical Aid</option>
                <option value="cash">Cash</option>
                <option value="company">Company</option>
                <option value="other">Other</option>
              </select>
            </div>

            {membership.fundingType === 'medical_aid' && (
              <>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Medical Aid Name</label>
                  <input type="text" value={membership.medicalAidName} onChange={e => setMembership({...membership, medicalAidName: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Plan *</label>
                  <input type="text" required value={membership.medicalAidPlan} onChange={e => setMembership({...membership, medicalAidPlan: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
                </div>
                 <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Number</label>
                  <input type="text" value={membership.medicalAidNumber} onChange={e => setMembership({...membership, medicalAidNumber: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
                </div>
              </>
            )}

            {/* Main Member Fields - Show only if patient is NOT main member */}
            {!membership.patientIsMainMember && (
              <div className="sm:col-span-6 bg-gray-50 p-4 rounded-md grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6 mt-4 border border-gray-200">
                <div className="sm:col-span-6">
                   <h4 className="text-sm font-medium text-gray-900">Main Member Details (Required)</h4>
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Main Member First Name *</label>
                  <input type="text" required value={membership.mainMemberFirstName} onChange={e => setMembership({...membership, mainMemberFirstName: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Main Member Last Name *</label>
                  <input type="text" required value={membership.mainMemberLastName} onChange={e => setMembership({...membership, mainMemberLastName: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
                </div>
                 <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Main Member ID *</label>
                  <input type="text" required value={membership.mainMemberIdNumber} onChange={e => setMembership({...membership, mainMemberIdNumber: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Main Member Cell *</label>
                  <input type="text" required value={membership.mainMemberCellNumber} onChange={e => setMembership({...membership, mainMemberCellNumber: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Main Member Employer *</label>
                  <input type="text" required value={membership.mainMemberEmployer} onChange={e => setMembership({...membership, mainMemberEmployer: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Employer Contact *</label>
                  <input type="text" required value={membership.mainMemberEmployerContact} onChange={e => setMembership({...membership, mainMemberEmployerContact: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
                </div>
                 <div className="sm:col-span-6">
                  <label className="block text-sm font-medium text-gray-700">Main Member Postal Address *</label>
                  <textarea rows={2} required value={membership.mainMemberPostalAddress} onChange={e => setMembership({...membership, mainMemberPostalAddress: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pt-5">
          <div className="flex justify-end">
            <Link
              href="/patients"
              className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70"
            >
              {loading ? 'Saving...' : 'Save Patient'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

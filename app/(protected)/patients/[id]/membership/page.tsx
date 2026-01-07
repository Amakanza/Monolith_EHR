
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { UpsertPatientMembershipInput } from '@/lib/types/patients';
import Link from 'next/link';

export default function EditMembershipPage() {
  const router = useRouter();
  const params = useParams();
  const [membership, setMembership] = useState<UpsertPatientMembershipInput | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Use id
  const patientId = params?.id as string;

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/patients/${patientId}/membership`);
      if (res.ok) {
        const json = await res.json();
        // If membership exists, use it, else default structure
        const m = json.membership;
        setMembership(m ? m : {
          fundingType: 'medical_aid',
          patientIsMainMember: true,
          medicalAidPlan: ''
        });
      }
      setLoading(false);
    }
    if (patientId) load();
  }, [patientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!membership) return;
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/patients/${patientId}/membership`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(membership),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      
      router.push(`/patients/${patientId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!membership) return <div className="p-8">Error loading data</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-0">
      <div className="mb-6">
        <Link href={`/patients/${patientId}`} className="text-sm text-gray-500 hover:text-gray-900">&larr; Back to Patient</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Edit Membership</h1>
      </div>

      {error && <div className="bg-red-50 p-4 mb-4 text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white shadow sm:rounded-lg p-6 space-y-6">
         <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-6 flex items-center mb-4">
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
              <select value={membership.fundingType || 'medical_aid'} onChange={e => setMembership({...membership, fundingType: e.target.value as any})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border">
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
                  <input type="text" value={membership.medicalAidName || ''} onChange={e => setMembership({...membership, medicalAidName: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Plan</label>
                  <input type="text" required value={membership.medicalAidPlan || ''} onChange={e => setMembership({...membership, medicalAidPlan: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
                </div>
                 <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Number</label>
                  <input type="text" value={membership.medicalAidNumber || ''} onChange={e => setMembership({...membership, medicalAidNumber: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
                </div>
              </>
            )}

            {!membership.patientIsMainMember && (
              <div className="sm:col-span-6 bg-gray-50 p-4 rounded-md grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6 border border-gray-200">
                <div className="sm:col-span-6">
                   <h4 className="text-sm font-medium text-gray-900">Main Member Details</h4>
                </div>
                 <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input type="text" required value={membership.mainMemberFirstName || ''} onChange={e => setMembership({...membership, mainMemberFirstName: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input type="text" required value={membership.mainMemberLastName || ''} onChange={e => setMembership({...membership, mainMemberLastName: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
                </div>
                 <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">ID Number</label>
                  <input type="text" required value={membership.mainMemberIdNumber || ''} onChange={e => setMembership({...membership, mainMemberIdNumber: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
                </div>
                 <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Employer</label>
                  <input type="text" required value={membership.mainMemberEmployer || ''} onChange={e => setMembership({...membership, mainMemberEmployer: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
                </div>
                 <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Employer Contact</label>
                  <input type="text" required value={membership.mainMemberEmployerContact || ''} onChange={e => setMembership({...membership, mainMemberEmployerContact: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
                </div>
              </div>
            )}
         </div>

         <div className="flex justify-end pt-5">
           <Link
              href={`/patients/${patientId}`}
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

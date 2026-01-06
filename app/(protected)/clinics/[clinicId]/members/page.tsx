'use client';

import React, { useEffect, useState } from 'react';
import { ClinicMemberProfile, ClinicRole } from '@/lib/types/clinics';
import { useParams } from 'next/navigation';

export default function MembersPage() {
  const params = useParams();
  const [members, setMembers] = useState<ClinicMemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState<ClinicRole | null>(null);
  
  // Add Member State
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState<ClinicRole>('clinician');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        // Fetch my role first
        const cRes = await fetch(`/api/clinics/${params.clinicId}`);
        if (cRes.ok) {
          const cData = await cRes.json();
          setMyRole(cData.myRole);
        }

        // Fetch members
        const res = await fetch(`/api/clinics/${params.clinicId}/members`);
        if (res.ok) {
          const data = await res.json();
          setMembers(data.members);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.clinicId]);

  const canManage = myRole === 'owner' || myRole === 'admin';

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setError('');

    try {
      const res = await fetch(`/api/clinics/${params.clinicId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: newUserId, role: newRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      // Reload
      const reload = await fetch(`/api/clinics/${params.clinicId}/members`);
      const data = await reload.json();
      setMembers(data.members);
      setNewUserId('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      const res = await fetch(`/api/clinics/${params.clinicId}/members/${userId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setMembers(members.filter(m => m.userId !== userId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8">Loading members...</div>;

  return (
    <div className="px-4 py-6 sm:px-0">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Clinic Members</h1>

      {canManage && (
        <div className="bg-gray-50 p-4 rounded-md mb-8 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Add New Member</h3>
          <form onSubmit={handleAdd} className="flex gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-700">User ID (UUID)</label>
              <input
                type="text"
                required
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                className="mt-1 block w-64 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                placeholder="e.g. 123e4567-..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as ClinicRole)}
                className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              >
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
                <option value="clinician">Clinician</option>
                <option value="receptionist">Receptionist</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={adding}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-70"
            >
              {adding ? 'Adding...' : 'Add Member'}
            </button>
          </form>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {members.map((member) => (
            <li key={member.membershipId} className="px-4 py-4 sm:px-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600">{member.fullName}</p>
                <p className="text-sm text-gray-500">ID: {member.userId}</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                  {member.role}
                </span>
                {canManage && (
                  <button
                    onClick={() => handleRemove(member.userId)}
                    className="text-sm text-red-600 hover:text-red-900"
                  >
                    Remove
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

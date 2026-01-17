
'use client';

import React, { useEffect, useState } from 'react';
import { ClinicMemberProfile, ClinicRole } from '@/lib/types/clinics';
import { useParams } from 'next/navigation';
import { useClinic } from '@/src/contexts/ClinicContext';
import UserSearch from '@/components/UserSearch';

export default function MembersPage() {
  const params = useParams();
  const { 
    members, 
    membersLoading, 
    membersError, 
    refreshMembers,
    isAdmin,
    activeClinicId 
  } = useClinic();
  
  // Use id
  const clinicId = params?.id as string;
  
  // Add Member State
  const [selectedUser, setSelectedUser] = useState<{ id: string; full_name: string | null } | null>(null);
  const [newRole, setNewRole] = useState<ClinicRole>('clinician');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  // Refresh members when clinic changes
  useEffect(() => {
    if (clinicId && clinicId === activeClinicId) {
      refreshMembers(clinicId);
    }
  }, [clinicId, activeClinicId, refreshMembers]);

  const canManage = isAdmin;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser && !emailInput) {
      setError('Please select a user or enter an email');
      return;
    }
    
    setAdding(true);
    setError('');

    try {
      const requestBody: any = { role: newRole };
      
      if (selectedUser) {
        requestBody.userId = selectedUser.id;
      } else {
        requestBody.email = emailInput;
      }

      const res = await fetch(`/api/clinics/${clinicId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      // Refresh members
      await refreshMembers(clinicId);
      
      // Reset form
      setSelectedUser(null);
      setEmailInput('');
      setShowEmailInput(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      const res = await fetch(`/api/clinics/${clinicId}/members/${userId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      await refreshMembers(clinicId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (membersLoading) return <div className="p-8">Loading members...</div>;
  if (membersError) return <div className="p-8 text-red-600">Error loading members: {membersError}</div>;

  return (
    <div className="px-4 py-6 sm:px-0">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Clinic Members</h1>

      {canManage && (
        <div className="bg-gray-50 p-4 rounded-md mb-8 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Add New Member</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="flex gap-4">
              {!showEmailInput ? (
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Search User</label>
                  <UserSearch
                    onUserSelect={(user) => {
                      setSelectedUser(user);
                      setShowEmailInput(false);
                      setEmailInput('');
                    }}
                    placeholder="Search for user by name..."
                  />
                  {selectedUser && (
                    <div className="mt-2 p-2 bg-indigo-50 border border-indigo-200 rounded">
                      <span className="text-sm text-indigo-700">
                        Selected: {selectedUser.full_name || `User ${selectedUser.id.slice(0, 8)}...`}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedUser(null)}
                        className="ml-2 text-xs text-indigo-600 hover:text-indigo-800"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    placeholder="user@example.com"
                  />
                </div>
              )}
            </div>
            
            <div className="flex gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as ClinicRole)}
                  className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                >
                  <option value="clinician">Clinician</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailInput(!showEmailInput);
                    setSelectedUser(null);
                    setEmailInput('');
                  }}
                  className="rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                >
                  {showEmailInput ? 'Search Users' : 'Use Email'}
                </button>
                
                <button
                  type="submit"
                  disabled={adding}
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-70"
                >
                  {adding ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </div>
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

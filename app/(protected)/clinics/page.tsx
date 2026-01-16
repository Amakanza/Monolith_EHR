'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clinic } from '@/lib/types/clinics';
import { useRouter } from 'next/navigation';

export default function ClinicsListPage() {
  const router = useRouter();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadClinics() {
      try {
        setLoading(true);
        setError('');
        
        const response = await fetch('/api/clinics');
        if (!response.ok) {
          throw new Error('Failed to fetch clinics');
        }
        
        const result = await response.json();
        setClinics(result.clinics || []);
      } catch (e: any) {
        console.error('Failed to load clinics:', e);
        setError(e.message || 'Failed to load clinics');
      } finally {
        setLoading(false);
      }
    }
    loadClinics();
  }, []);

  const handleOpen = async (clinicId: string) => {
    try {
      // Set as active then navigate
      const response = await fetch('/api/clinics/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to set active clinic');
      }
      
      router.push(`/clinics/${clinicId}`);
      router.refresh();
    } catch (e: any) {
      console.error('Failed to open clinic:', e);
      setError(e.message || 'Failed to open clinic');
    }
  };

  if (loading) return <div className="p-8">Loading clinics...</div>;

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Clinics</h1>
        <Link
          href="/clinics/new"
          className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          Create Clinic
        </Link>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 p-4 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {clinics.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">You don't belong to any clinics yet.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul role="list" className="divide-y divide-gray-200">
            {clinics.map((clinic) => (
              <li key={clinic.id}>
                <div className="flex items-center px-4 py-4 sm:px-6">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-sm font-medium text-indigo-600">{clinic.name}</p>
                      <div className="ml-2 flex flex-shrink-0">
                        <p className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                          {clinic.timezone}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-5 flex-shrink-0">
                    <button
                      onClick={() => handleOpen(clinic.id)}
                      className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Open
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
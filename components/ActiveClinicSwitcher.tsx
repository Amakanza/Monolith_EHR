'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clinic } from '@/lib/types/clinics';

export default function ActiveClinicSwitcher({ 
  currentActiveId 
}: { 
  currentActiveId?: string | null 
}) {
  const router = useRouter();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(currentActiveId || '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClinics() {
      try {
        setError(null);
        const res = await fetch('/api/clinics');
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const errorMessage = errorData.error || `HTTP ${res.status}: ${res.statusText}`;
          throw new Error(errorMessage);
        }
        
        const data = await res.json();
        setClinics(data.clinics || []);
        
        if (!data.clinics || data.clinics.length === 0) {
          setError('No clinics found. You may need to create a clinic first.');
        }
      } catch (e) {
        console.error('Failed to load clinics:', e);
        const errorMessage = e instanceof Error ? e.message : 'Failed to load clinics';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
    fetchClinics();
  }, []);

  useEffect(() => {
    if (currentActiveId) setActiveId(currentActiveId);
  }, [currentActiveId]);

  const handleSwitch = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    if (!newId) return;

    try {
      const res = await fetch('/api/clinics/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: newId }),
      });

      if (res.ok) {
        setActiveId(newId);
        router.refresh();
        // Optional: Redirect to dashboard if on a clinic-specific page
        // router.push(`/clinics/${newId}`);
      }
    } catch (error) {
      console.error('Failed to switch clinic');
    }
  };

  if (loading) return <span className="text-xs text-gray-500">Loading clinics...</span>;

  if (error) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-red-600">Error:</span>
        <span className="text-xs text-red-500">{error}</span>
      </div>
    );
  }

  if (clinics.length === 0) {
    return <span className="text-xs text-gray-400">No clinics found</span>;
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-700">Clinic:</span>
      <select
        value={activeId}
        onChange={handleSwitch}
        className="block w-full rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
      >
        <option value="" disabled>Select Clinic...</option>
        {clinics.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}

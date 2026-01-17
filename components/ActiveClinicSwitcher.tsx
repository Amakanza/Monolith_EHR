'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useClinic } from '@/src/contexts/ClinicContext';

export default function ActiveClinicSwitcher({ 
  currentActiveId 
}: { 
  currentActiveId?: string | null 
}) {
  const router = useRouter();
  const {
    clinics,
    activeClinicId,
    loading,
    error,
    setActiveClinic,
    clearError
  } = useClinic();

  const handleSwitch = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    if (!newId) return;

    clearError();
    const success = await setActiveClinic(newId);
    
    if (success) {
      router.refresh();
    }
  };

  // Sync server-side active clinic with context
  React.useEffect(() => {
    if (currentActiveId && currentActiveId !== activeClinicId) {
      setActiveClinic(currentActiveId);
    }
  }, [currentActiveId, activeClinicId, setActiveClinic]);

  if (loading) {
    return <span className="text-xs text-gray-500">Loading clinics...</span>;
  }

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
        value={activeClinicId || ''}
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

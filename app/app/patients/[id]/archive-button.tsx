'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ArchivePatientButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this patient? They will no longer appear in the active list.')) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/patients/${id}`, {
        method: 'PATCH',
      });

      if (!res.ok) throw new Error('Failed to archive');

      router.refresh();
      router.push('/app/patients');
    } catch (e) {
      alert('Error archiving patient');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleArchive}
      disabled={loading}
      className="rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-50 disabled:opacity-50"
    >
      {loading ? 'Archiving...' : 'Archive Patient'}
    </button>
  );
}

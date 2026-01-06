'use client';

import { createClinicAction } from '@/actions/clinic-actions';
import { useState } from 'react';

export default function OnboardingPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError(null);
    const result = await createClinicAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // On success, the action redirects, so no need to setLoading(false)
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 pt-10">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Welcome!</h1>
        <p className="text-gray-500">To get started, create your clinic workspace.</p>
      </div>
      <form action={handleSubmit} className="space-y-4 rounded bg-white p-6 shadow">
        <div>
          <label className="block text-sm font-medium">Clinic Name</label>
          <input 
            name="name" 
            type="text" 
            required 
            className="mt-1 block w-full rounded border p-2" 
            placeholder="My Physio Practice" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium">URL Identifier (Slug)</label>
          <input 
            name="slug" 
            type="text" 
            required 
            className="mt-1 block w-full rounded border p-2" 
            placeholder="my-physio-practice" 
          />
          <p className="text-xs text-gray-500 mt-1">Used for your public booking URL. Lowercase letters, numbers, and dashes only.</p>
        </div>
        
        {error && (
          <div className="rounded bg-red-50 p-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full rounded bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Workspace'}
        </button>
      </form>
    </div>
  );
}
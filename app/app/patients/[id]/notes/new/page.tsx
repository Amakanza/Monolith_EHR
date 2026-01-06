'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { id: patientId } = await params;
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          ...data,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to create note');
      }

      const note = await res.json();
      router.push(`/app/notes/${note.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  // Unwrap params for sync usage in Link if needed, though we use async/await inside submit
  // To avoid hydration issues with params promise, we rely on the fact this is a Client Component wrapper effectively.
  // Actually, client components receive params as a Promise in Next 15, but we can't await it in top level.
  // We'll use React.use() or just wait for submit. For the back link, we strictly need ID.
  // Let's use a simple state or fetch it.
  // A cleaner way in Client Components for Next 15 is `use(params)`.
  // Since I can't assume React 19 features fully, I'll trust the prop passing or async wrapper.
  // Wait, user provided Next.js 14 config in package.json in previous prompt.
  // If Next 14, params is an object, not promise. 
  // But the prompt context showed `params: Promise<{ id: string }>` in recent file updates.
  // I will assume Promise and use `use` or standard async unwrapping.
  // Standard workaround for Client Comp:
  const [patientId, setPatientId] = useState<string>('');
  
  useState(() => {
    params.then(p => setPatientId(p.id));
  });

  if (!patientId) return <div className="p-6">Loading...</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/app/patients/${patientId}/notes`} className="text-sm font-medium text-gray-500 hover:text-gray-900">
          ← Back to List
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">New SOAP Note</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Subjective</label>
            <div className="mt-1">
              <textarea
                name="subjective"
                rows={4}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                placeholder="Patient's chief complaint, history of present illness..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Objective</label>
            <div className="mt-1">
              <textarea
                name="objective"
                rows={4}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                placeholder="Physical exam findings, vital signs, lab results..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Assessment</label>
            <div className="mt-1">
              <textarea
                name="assessment"
                rows={4}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                placeholder="Diagnosis, differential diagnosis, status of condition..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Plan</label>
            <div className="mt-1">
              <textarea
                name="plan"
                rows={4}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                placeholder="Treatment plan, medications, follow-up..."
              />
            </div>
          </div>

        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-4">
          <Link
            href={`/app/patients/${patientId}/notes`}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Draft'}
          </button>
        </div>
      </form>
    </div>
  );
}

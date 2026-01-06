'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [noteId, setNoteId] = useState<string>('');
  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then(p => {
      setNoteId(p.id);
      fetchNote(p.id);
    });
  }, [params]);

  async function fetchNote(id: string) {
    try {
      const res = await fetch(`/api/notes/${id}`);
      if (!res.ok) throw new Error('Failed to load note');
      const data = await res.json();
      setNote(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to save');
      const updated = await res.json();
      setNote(updated);
      alert('Draft saved.');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleFinalize() {
    if (!confirm('Are you sure? Finalized notes cannot be edited.')) return;
    setFinalizing(true);
    try {
      const res = await fetch(`/api/notes/${noteId}/finalize`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to finalize');
      const updated = await res.json();
      setNote(updated);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setFinalizing(false);
    }
  }

  if (loading) return <div className="p-6">Loading note...</div>;
  if (!note) return <div className="p-6 text-red-600">{error || 'Note not found'}</div>;

  const isFinal = note.status === 'final';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/app/patients/${note.patient_id}/notes`} className="text-sm font-medium text-gray-500 hover:text-gray-900">
            ← Back to Patient Notes
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {isFinal ? 'Finalized Note' : 'Edit Draft'}
            </h1>
            {isFinal && (
              <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                Finalized {new Date(note.finalized_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        {!isFinal && (
          <button
            onClick={handleFinalize}
            disabled={finalizing}
            className="rounded-md bg-green-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50"
          >
            {finalizing ? 'Finalizing...' : 'Finalize Note'}
          </button>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-6">
          <div className="grid gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Subjective</label>
              <textarea
                name="subjective"
                rows={4}
                disabled={isFinal}
                defaultValue={note.subjective}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Objective</label>
              <textarea
                name="objective"
                rows={4}
                disabled={isFinal}
                defaultValue={note.objective}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Assessment</label>
              <textarea
                name="assessment"
                rows={4}
                disabled={isFinal}
                defaultValue={note.assessment}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Plan</label>
              <textarea
                name="plan"
                rows={4}
                disabled={isFinal}
                defaultValue={note.plan}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
          </div>
          
          {/* Attachments Stub */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Attachments (Coming Soon)</h3>
            <div className="rounded-md border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">
              Upload functionality will be available in future updates.
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!isFinal && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

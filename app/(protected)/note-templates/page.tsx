
'use client';

import React, { useEffect, useState } from 'react';
import { NoteTemplate } from '@/lib/types/notes';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

export default function TemplatesPage() {
  const { user } = useCurrentUser();
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');

  const fetchTemplates = async () => {
    if (!user?.activeClinicId) return;
    const res = await fetch('/api/note-templates?includeInactive=true');
    if (res.ok) setTemplates((await res.json()).templates);
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
  }, [user?.activeClinicId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.activeClinicId) return;

    await fetch('/api/note-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName })
    });
    setNewName('');
    setShowForm(false);
    fetchTemplates();
  };

  const toggleActive = async (t: NoteTemplate) => {
    await fetch(`/api/note-templates/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !t.isActive })
    });
    fetchTemplates();
  };

  if (!user?.activeClinicId) return <div className="p-8">Select a clinic.</div>;

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Note Templates</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          {showForm ? 'Cancel' : 'Add Template'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-md mb-6 border border-gray-200 flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700">Template Name</label>
            <input required value={newName} onChange={e => setNewName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 text-sm" placeholder="e.g. Standard Physio" />
          </div>
          <button type="submit" className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">Save</button>
        </form>
      )}

      {loading ? <div>Loading...</div> : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {templates.map(t => (
              <li key={t.id} className="px-4 py-4 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900">{t.name}</span>
                  {!t.isActive && <span className="ml-2 px-2 py-0.5 rounded bg-red-100 text-xs text-red-800">Inactive</span>}
                </div>
                <button onClick={() => toggleActive(t)} className="text-sm text-indigo-600 hover:underline">
                  {t.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </li>
            ))}
            {templates.length === 0 && <li className="px-4 py-8 text-center text-gray-500 text-sm">No templates found.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

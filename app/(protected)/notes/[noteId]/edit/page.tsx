
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ClinicalNoteWithAttachments } from '@/lib/types/notes';
import Link from 'next/link';

export default function EditNotePage() {
  const params = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '', noteDate: '', subjective: '', objective: '', assessment: '', plan: '', additionalText: ''
  });

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/notes/${params.noteId}`);
      if (!res.ok) {
        alert('Error loading');
        router.back();
        return;
      }
      const data: ClinicalNoteWithAttachments = await res.json();
      if (data.note.status === 'final') {
        alert('Cannot edit finalized note');
        router.push(`/notes/${params.noteId}`);
        return;
      }
      setFormData({
        title: data.note.title,
        noteDate: data.note.noteDate,
        subjective: data.note.subjective || '',
        objective: data.note.objective || '',
        assessment: data.note.assessment || '',
        plan: data.note.plan || '',
        additionalText: data.note.additionalText || ''
      });
      setLoading(false);
    }
    load();
  }, [params.noteId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/notes/${params.noteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    router.push(`/notes/${params.noteId}`);
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-0">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Note</h1>
      
      <form onSubmit={handleSubmit} className="bg-white shadow sm:rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-2 gap-6">
           <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input required type="date" value={formData.noteDate} onChange={e => setFormData({...formData, noteDate: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
          </div>
        </div>
        <div className="border-t border-gray-200 pt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Subjective</label>
            <textarea rows={3} value={formData.subjective} onChange={e => setFormData({...formData, subjective: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Objective</label>
            <textarea rows={3} value={formData.objective} onChange={e => setFormData({...formData, objective: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Assessment</label>
            <textarea rows={3} value={formData.assessment} onChange={e => setFormData({...formData, assessment: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Plan</label>
            <textarea rows={3} value={formData.plan} onChange={e => setFormData({...formData, plan: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700">Additional</label>
             <textarea rows={2} value={formData.additionalText} onChange={e => setFormData({...formData, additionalText: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
          </div>
        </div>
        <div className="flex justify-end pt-4">
           <Link href={`/notes/${params.noteId}`} className="mr-3 py-2 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</Link>
           <button type="submit" className="py-2 px-4 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700">
             Save Changes
           </button>
        </div>
      </form>
    </div>
  );
}

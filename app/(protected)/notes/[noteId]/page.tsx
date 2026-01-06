
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ClinicalNoteWithAttachments } from '@/lib/types/notes';
import Link from 'next/link';

export default function NoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<ClinicalNoteWithAttachments | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/notes/${params.noteId}`);
      if (res.ok) setData(await res.json());
      setLoading(false);
    }
    load();
  }, [params.noteId]);

  const handleFinalize = async () => {
    if (!confirm('Are you sure? Once finalized, this note cannot be edited.')) return;
    const res = await fetch(`/api/notes/${params.noteId}/finalize`, { method: 'POST' });
    if (res.ok) {
       // Reload
       window.location.reload();
    } else {
       alert('Failed to finalize.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);

    try {
      // 1. Get Signed URL
      const urlRes = await fetch(`/api/notes/${params.noteId}/attachments/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type })
      });
      if (!urlRes.ok) throw new Error('Failed to get upload URL');
      const { uploadUrl, objectPath } = await urlRes.json();

      // 2. Upload to Storage
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });
      if (!uploadRes.ok) throw new Error('Upload failed');

      // 3. Record Metadata
      await fetch(`/api/notes/${params.noteId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          objectPath,
          contentType: file.type,
          fileSizeBytes: file.size
        })
      });

      // Reload
      const reload = await fetch(`/api/notes/${params.noteId}`);
      setData(await reload.json());
      
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!data) return <div className="p-8">Note not found.</div>;

  const { note, attachments } = data;
  const isDraft = note.status === 'draft';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-0">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Link href={`/patients/${note.patientId}/notes`} className="text-sm text-gray-500 hover:text-gray-900">&larr; Back to Patient Notes</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2 flex items-center gap-3">
            {note.title}
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-sm font-medium ${isDraft ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
              {isDraft ? 'Draft' : 'Finalized'}
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">{new Date(note.noteDate).toLocaleDateString()} • {note.authorName}</p>
        </div>
        <div className="flex gap-3">
          {isDraft && (
            <>
              <button
                onClick={handleFinalize}
                className="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
              >
                Finalize
              </button>
              <Link
                href={`/notes/${note.id}/edit`}
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Edit
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">SOAP Details</h3>
        </div>
        <div className="px-4 py-5 sm:p-6 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-semibold text-gray-700 text-sm">Subjective</h4>
                <p className="mt-2 text-sm text-gray-900 whitespace-pre-wrap">{note.subjective || '-'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-semibold text-gray-700 text-sm">Objective</h4>
                <p className="mt-2 text-sm text-gray-900 whitespace-pre-wrap">{note.objective || '-'}</p>
              </div>
               <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-semibold text-gray-700 text-sm">Assessment</h4>
                <p className="mt-2 text-sm text-gray-900 whitespace-pre-wrap">{note.assessment || '-'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-semibold text-gray-700 text-sm">Plan</h4>
                <p className="mt-2 text-sm text-gray-900 whitespace-pre-wrap">{note.plan || '-'}</p>
              </div>
           </div>
           {note.additionalText && (
             <div>
               <h4 className="font-semibold text-gray-700 text-sm">Additional Notes</h4>
               <p className="mt-2 text-sm text-gray-900 whitespace-pre-wrap">{note.additionalText}</p>
             </div>
           )}
        </div>
        {note.status === 'final' && (
           <div className="px-4 py-3 bg-gray-50 text-xs text-gray-500 border-t border-gray-200">
             Finalized by {note.finalizerName} on {new Date(note.finalizedAt!).toLocaleString()}
           </div>
        )}
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Attachments</h3>
          {/* Allow attachments even if finalized? Usually yes, to add scanned docs later. But strict logic might say no. Allowing for now. */}
          <label className="cursor-pointer rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
             {uploading ? 'Uploading...' : 'Upload File'}
             <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
          </label>
        </div>
        <ul className="divide-y divide-gray-200">
          {attachments.length === 0 ? (
            <li className="px-4 py-8 text-center text-gray-500 text-sm">No attachments.</li>
          ) : attachments.map(att => (
             <li key={att.id} className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center">
                   <svg className="h-5 w-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                   </svg>
                   <div>
                     <p className="text-sm font-medium text-indigo-600">{att.fileName}</p>
                     <p className="text-xs text-gray-500">{(att.fileSizeBytes! / 1024).toFixed(1)} KB • {new Date(att.createdAt).toLocaleDateString()}</p>
                   </div>
                </div>
                {/* Download link requires generating a signed URL again, omitting for brevity or implement a download route */}
             </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

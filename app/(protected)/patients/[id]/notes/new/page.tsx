
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { NoteTemplate } from '@/lib/types/notes';
import { Appointment } from '@/lib/types/appointments';
import Link from 'next/link';

export default function NewNotePage() {
  const params = useParams();
  const router = useRouter();
  
  // Use id
  const patientId = params?.id as string;
  
  // State
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState('');
  
  const [formData, setFormData] = useState({
    title: 'Clinical Note',
    noteDate: new Date().toISOString().split('T')[0],
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    additionalText: ''
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function init() {
      // Fetch Templates
      const tRes = await fetch('/api/note-templates');
      if (tRes.ok) setTemplates((await tRes.json()).templates);

      // Fetch Recent Appointments
      // We are fetching appointments for this patient (simple list)
      const aRes = await fetch(`/api/appointments?patientId=${patientId}&status=booked&to=${new Date().toISOString()}`); 
      // Actually we want all statuses or recent ones. Let's just grab what we can.
      const aRes2 = await fetch(`/api/appointments?patientId=${patientId}&status=completed`);
      
      let apps: Appointment[] = [];
      if (aRes2.ok) apps = [...apps, ...(await aRes2.json()).appointments];
      // Sort desc
      apps.sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      setAppointments(apps);
    }
    if (patientId) init();
  }, [patientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/patients/${patientId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          templateId: selectedTemplate || undefined,
          appointmentId: selectedAppointment || undefined
        })
      });

      if (!res.ok) throw new Error('Failed to create note');
      
      const { note } = await res.json();
      router.push(`/notes/${note.id}`);
    } catch (err) {
      alert('Error creating note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-0">
      <div className="mb-6">
        <Link href={`/patients/${patientId}/notes`} className="text-sm text-gray-500 hover:text-gray-900">&larr; Back to List</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">New Clinical Note</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow sm:rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Template</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
              value={selectedTemplate}
              onChange={e => setSelectedTemplate(e.target.value)}
            >
              <option value="">None (Standard SOAP)</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Link to Appointment (Optional)</label>
            <select
               className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
               value={selectedAppointment}
               onChange={e => setSelectedAppointment(e.target.value)}
            >
              <option value="">None</option>
              {appointments.map(a => (
                <option key={a.id} value={a.id}>
                  {new Date(a.startTime).toLocaleDateString()} - {a.appointmentTypeName || 'Appt'} ({a.status})
                </option>
              ))}
            </select>
          </div>
        </div>

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
            <label className="block text-sm font-medium text-gray-700">Additional Notes</label>
            <textarea rows={2} value={formData.additionalText} onChange={e => setFormData({...formData, additionalText: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
          </div>
        </div>

        <div className="flex justify-end pt-4">
           <Link href={`/patients/${patientId}/notes`} className="mr-3 py-2 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</Link>
           <button type="submit" disabled={loading} className="py-2 px-4 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-70">
             {loading ? 'Saving...' : 'Save Draft'}
           </button>
        </div>
      </form>
    </div>
  );
}

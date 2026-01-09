
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { MessageTemplate } from '@/lib/types/communications';

export default function TemplatesPage() {
  const { user } = useCurrentUser();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', channel: 'sms', subject: '', body: '' });

  async function load() {
    if (!user?.activeClinicId) return;
    const res = await fetch('/api/message-templates');
    if (res.ok) setTemplates((await res.json()).templates);
  }

  useEffect(() => {
    load();
  }, [user?.activeClinicId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.activeClinicId) return;
    await fetch('/api/message-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, clinicId: user.activeClinicId })
    });
    setForm({ name: '', channel: 'sms', subject: '', body: '' });
    setShowForm(false);
    load();
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <div>
           <Link href="/communications/messages" className="text-sm text-gray-500 hover:text-gray-900">&larr; Back to Messages</Link>
           <h1 className="text-2xl font-bold text-gray-900 mt-2">Message Templates</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 text-white px-3 py-2 rounded-md text-sm">
          {showForm ? 'Cancel' : 'New Template'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-md mb-6 border border-gray-200 space-y-4">
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-medium text-gray-700">Name</label>
               <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 text-sm border" />
             </div>
             <div>
               <label className="block text-xs font-medium text-gray-700">Channel</label>
               <select value={form.channel} onChange={e => setForm({...form, channel: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 text-sm border">
                 <option value="sms">SMS</option>
                 <option value="email">Email</option>
                 <option value="whatsapp">WhatsApp</option>
               </select>
             </div>
           </div>
           {form.channel === 'email' && (
             <div>
               <label className="block text-xs font-medium text-gray-700">Subject</label>
               <input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 text-sm border" />
             </div>
           )}
           <div>
              <label className="block text-xs font-medium text-gray-700">Body</label>
              <textarea required rows={3} value={form.body} onChange={e => setForm({...form, body: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 text-sm border" />
           </div>
           <button type="submit" className="bg-indigo-600 text-white px-3 py-2 rounded-md text-sm">Save Template</button>
        </form>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
           {templates.map(t => (
             <li key={t.id} className="px-4 py-4">
               <div className="flex justify-between">
                 <p className="text-sm font-medium text-gray-900">{t.name} <span className="text-gray-500 text-xs">({t.channel})</span></p>
                 <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                   {t.isActive ? 'Active' : 'Inactive'}
                 </span>
               </div>
               <p className="text-sm text-gray-500 mt-1 truncate">{t.body}</p>
             </li>
           ))}
        </ul>
      </div>
    </div>
  );
}

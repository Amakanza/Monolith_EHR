
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { Patient } from '@/lib/types/patients';
import { MessageTemplate } from '@/lib/types/communications';
import Link from 'next/link';

export default function NewMessagePage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  
  const [patientId, setPatientId] = useState('');
  const [channel, setChannel] = useState<'sms' | 'email'>('sms');
  const [contact, setContact] = useState('');
  const [body, setBody] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function init() {
      if (user?.activeClinicId) {
        const pRes = await fetch('/api/patients?limit=100');
        if (pRes.ok) setPatients((await pRes.json()).patients);

        const tRes = await fetch('/api/message-templates');
        if (tRes.ok) setTemplates((await tRes.json()).templates);
      }
    }
    init();
  }, [user?.activeClinicId]);

  // Auto-fill contact when patient changes
  useEffect(() => {
    if (patientId) {
      const p = patients.find(x => x.id === patientId);
      if (p) {
        if (channel === 'sms') setContact(p.cellNumber || '');
        else setContact(p.email || '');
      }
    }
  }, [patientId, channel, patients]);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tId = e.target.value;
    if (!tId) return;
    const t = templates.find(x => x.id === tId);
    if (t) {
      setBody(t.body);
      if (t.channel === 'email' || t.channel === 'sms') setChannel(t.channel);
      if (t.subject) setSubject(t.subject);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const p = patients.find(x => x.id === patientId);
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: user?.activeClinicId,
          patientId,
          recipientName: p ? `${p.firstName} ${p.lastName}` : 'Unknown',
          recipientContact: contact,
          channel,
          subject: channel === 'email' ? subject : undefined,
          body
        })
      });
      if (res.ok) router.push('/communications/messages');
    } catch (e) {
      alert('Error sending message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 sm:px-0">
      <div className="mb-6">
        <Link href="/communications/messages" className="text-sm text-gray-500 hover:text-gray-900">&larr; Back</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">New Message</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow sm:rounded-lg p-6 space-y-6">
        <div>
           <label className="block text-sm font-medium text-gray-700">Load Template</label>
           <select onChange={handleTemplateChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 text-sm border">
             <option value="">Select...</option>
             {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.channel})</option>)}
           </select>
        </div>

        <div className="border-t border-gray-200 pt-4">
           <label className="block text-sm font-medium text-gray-700">Patient</label>
           <select 
             required 
             value={patientId} 
             onChange={e => setPatientId(e.target.value)}
             className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 text-sm border"
           >
             <option value="">Select Patient...</option>
             {patients.map(p => (
               <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
             ))}
           </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Channel</label>
            <select 
              value={channel} 
              onChange={e => setChannel(e.target.value as any)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 text-sm border"
            >
              <option value="sms">SMS</option>
              <option value="email">Email</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Recipient Contact</label>
            <input required type="text" value={contact} onChange={e => setContact(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 text-sm border" />
          </div>
        </div>

        {channel === 'email' && (
          <div>
             <label className="block text-sm font-medium text-gray-700">Subject</label>
             <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 text-sm border" />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Message Body</label>
          <textarea required rows={4} value={body} onChange={e => setBody(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 text-sm border" />
        </div>

        <div className="flex justify-end">
           <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700">
             {loading ? 'Queuing...' : 'Queue Message'}
           </button>
        </div>
      </form>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';

export default function OutboundMessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({ patientId: '', channel: 'sms', subject: '', body: '' });

  async function loadData() {
    setLoading(true);
    const [msgRes, patRes, tempRes] = await Promise.all([
      fetch('/api/comms/outbound'),
      fetch('/api/patients'),
      fetch('/api/comms/templates')
    ]);
    if (msgRes.ok) setMessages(await msgRes.json());
    if (patRes.ok) setPatients(await patRes.json());
    if (tempRes.ok) setTemplates(await tempRes.json());
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tId = e.target.value;
    const t = templates.find(temp => temp.id === tId);
    if (t) {
      setFormData(prev => ({ ...prev, channel: t.channel, subject: t.subject || '', body: t.body }));
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/comms/outbound', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setShowForm(false);
      setFormData({ patientId: '', channel: 'sms', subject: '', body: '' });
      loadData();
    } else {
      alert('Failed to send');
    }
  }

  async function runReminders() {
    const res = await fetch('/api/comms/reminders/run', { method: 'POST' });
    const data = await res.json();
    alert(`Generated ${data.created} reminders.`);
    loadData();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Outbound Messages</h1>
        <div className="flex gap-2">
          <button onClick={runReminders} className="bg-gray-100 text-gray-700 border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-200">
            Run Reminders (Next 24h)
          </button>
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
            {showForm ? 'Cancel' : 'New Message'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded border shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Patient</label>
              <select 
                required
                value={formData.patientId}
                onChange={e => setFormData({...formData, patientId: e.target.value})}
                className="w-full border rounded p-2 text-sm"
              >
                <option value="">Select Patient...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Template (Optional)</label>
              <select onChange={handleTemplateChange} className="w-full border rounded p-2 text-sm">
                <option value="">Select Template...</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Channel</label>
              <select 
                value={formData.channel}
                onChange={e => setFormData({...formData, channel: e.target.value})}
                className="w-full border rounded p-2 text-sm"
              >
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            {formData.channel === 'email' && (
              <div>
                <label className="block text-sm font-medium">Subject</label>
                <input 
                  value={formData.subject}
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                  className="w-full border rounded p-2 text-sm"
                />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium">Message Body</label>
            <textarea 
              required
              rows={3}
              value={formData.body}
              onChange={e => setFormData({...formData, body: e.target.value})}
              className="w-full border rounded p-2 text-sm"
            />
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded text-sm">Send / Queue</button>
        </form>
      )}

      <div className="bg-white rounded border shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Channel</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Body</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {messages.map(m => (
              <tr key={m.id}>
                <td className="px-6 py-4 text-sm text-gray-900">{m.recipient_name}</td>
                <td className="px-6 py-4 text-sm text-gray-500 capitalize">{m.channel}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${m.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {m.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">{m.body}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(m.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {messages.length === 0 && !loading && (
              <tr><td colSpan={5} className="p-4 text-center text-sm text-gray-500">No outbound messages.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

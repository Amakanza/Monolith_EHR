'use client';

import { useState, useEffect } from 'react';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', channel: 'sms', subject: '', body: '' });

  async function fetchTemplates() {
    const res = await fetch('/api/comms/templates');
    if (res.ok) setTemplates(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/comms/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setFormData({ name: '', channel: 'sms', subject: '', body: '' });
      setShowForm(false);
      fetchTemplates();
    } else {
      alert('Failed to create template');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Message Templates</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'New Template'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded border shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input 
                required 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                className="w-full border rounded p-2 text-sm"
              />
            </div>
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
          <div>
            <label className="block text-sm font-medium">Body</label>
            <textarea 
              required 
              rows={3}
              value={formData.body} 
              onChange={e => setFormData({...formData, body: e.target.value})} 
              className="w-full border rounded p-2 text-sm"
            />
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded text-sm">Save</button>
        </form>
      )}

      <div className="bg-white rounded border shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Channel</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preview</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {templates.map(t => (
              <tr key={t.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{t.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500 capitalize">{t.channel}</td>
                <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">{t.body}</td>
              </tr>
            ))}
            {templates.length === 0 && !loading && (
              <tr><td colSpan={3} className="p-4 text-center text-sm text-gray-500">No templates.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

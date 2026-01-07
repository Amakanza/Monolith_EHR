
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewInvoicePage() {
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetch('/api/patients')
      .then(res => res.json())
      .then(data => setPatients(data))
      .catch(err => console.error(err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          issueDate,
          dueDate: dueDate || undefined,
          notes: notes || undefined
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed');
      }

      const invoice = await res.json();
      router.push(`/app/billing/invoices/${invoice.id}`);
    } catch (e) {
      alert('Error creating invoice');
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="mb-6">
        <Link href="/app/billing/invoices" className="text-sm text-gray-500 hover:text-gray-900">&larr; Back to Invoices</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">New Invoice</h1>
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Patient</label>
          <select 
            required 
            value={patientId} 
            onChange={e => setPatientId(e.target.value)} 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
          >
            <option value="">Select Patient...</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Issue Date</label>
            <input type="date" required value={issueDate} onChange={e => setIssueDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Due Date (Optional)</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
}

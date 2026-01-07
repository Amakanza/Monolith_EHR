
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { Patient } from '@/lib/types/patients';
import Link from 'next/link';

export default function NewInvoicePage() {
  const { user } = useCurrentUser();
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [taxRate, setTaxRate] = useState(0);

  useEffect(() => {
    async function init() {
      if (user?.activeClinicId) {
        // Fetch only patients
        const res = await fetch('/api/patients?limit=100');
        if (res.ok) setPatients((await res.json()).patients);
      }
    }
    init();
  }, [user?.activeClinicId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: user?.activeClinicId,
          patientId,
          taxRate
        })
      });
      if (!res.ok) throw new Error('Failed to create invoice');
      const { invoice } = await res.json();
      router.push(`/billing/invoices/${invoice.id}`);
    } catch (e) {
      alert('Error creating invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 sm:px-0">
       <div className="mb-6">
        <Link href="/billing/invoices" className="text-sm text-gray-500 hover:text-gray-900">&larr; Back to Invoices</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">New Invoice</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow sm:rounded-lg p-6 space-y-6">
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
              <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tax Rate (%)</label>
          <input 
            type="number" 
            min="0" 
            max="100" 
            value={taxRate} 
            onChange={e => setTaxRate(Number(e.target.value))} 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" 
          />
        </div>

        <div className="flex justify-end pt-4">
           <button type="submit" disabled={loading} className="py-2 px-4 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-70">
             {loading ? 'Creating...' : 'Create Invoice'}
           </button>
        </div>
      </form>
    </div>
  );
}

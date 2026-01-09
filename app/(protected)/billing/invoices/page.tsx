
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { Invoice } from '@/lib/types/billing';

export default function InvoicesListPage() {
  const { user } = useCurrentUser();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user?.activeClinicId) return;
      setLoading(true);
      const res = await fetch(`/api/invoices?clinicId=${user.activeClinicId}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices);
      }
      setLoading(false);
    }
    load();
  }, [user?.activeClinicId]);

  if (!user?.activeClinicId) return <div className="p-8">Select a clinic first.</div>;

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <Link 
          href="/billing/invoices/new"
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          Create Invoice
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {loading ? <div className="p-4 text-center">Loading...</div> : 
           invoices.length === 0 ? <div className="p-4 text-center text-gray-500">No invoices found.</div> :
           invoices.map(inv => (
            <li key={inv.id}>
              <Link href={`/billing/invoices/${inv.id}`} className="block hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-indigo-600 truncate">
                      {inv.invoiceNumber} <span className="text-gray-500">for {inv.patientName}</span>
                    </p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${inv.status === 'paid' ? 'bg-green-100 text-green-800' : 
                          inv.status === 'void' ? 'bg-gray-100 text-gray-800' : 
                          inv.status === 'sent' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        Date: {inv.issueDate}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p className="font-medium text-gray-900 mr-4">
                        {inv.currency} {(inv.totalCents / 100).toFixed(2)}
                      </p>
                      <p>
                        Due: {inv.balanceDueCents > 0 ? (inv.balanceDueCents / 100).toFixed(2) : '0.00'}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

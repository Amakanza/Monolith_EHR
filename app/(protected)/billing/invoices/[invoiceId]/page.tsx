
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { InvoiceWithItemsAndPayments, PaymentMethod } from '@/lib/types/billing';
import Link from 'next/link';

export default function InvoiceDetailPage() {
  const params = useParams();
  const [data, setData] = useState<InvoiceWithItemsAndPayments | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Item Form
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(0); // in standard units (e.g. dollars)
  const [addingItem, setAddingItem] = useState(false);

  // Payment Form
  const [payAmount, setPayAmount] = useState(0); // in standard units
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');
  const [payRef, setPayRef] = useState('');
  const [addingPay, setAddingPay] = useState(false);

  useEffect(() => {
    loadData();
  }, [params.invoiceId]);

  async function loadData() {
    const res = await fetch(`/api/invoices/${params.invoiceId}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingItem(true);
    await fetch(`/api/invoices/${params.invoiceId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: newItemDesc,
        quantity: newItemQty,
        unitPriceCents: Math.round(newItemPrice * 100)
      })
    });
    setNewItemDesc('');
    setNewItemPrice(0);
    setNewItemQty(1);
    setAddingItem(false);
    loadData();
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Remove item?')) return;
    await fetch(`/api/invoice-items/${itemId}`, { method: 'DELETE' });
    loadData();
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingPay(true);
    await fetch(`/api/invoices/${params.invoiceId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentDate: new Date().toISOString().split('T')[0],
        method: payMethod,
        amountCents: Math.round(payAmount * 100),
        reference: payRef
      })
    });
    setPayAmount(0);
    setPayRef('');
    setAddingPay(false);
    loadData();
  };

  const handleSend = async () => {
    if (!confirm('Mark as Sent?')) return;
    await fetch(`/api/invoices/${params.invoiceId}/send`, { method: 'POST' });
    loadData();
  };

  const handleVoid = async () => {
    if (!confirm('Void invoice? This cannot be undone.')) return;
    await fetch(`/api/invoices/${params.invoiceId}/void`, { method: 'POST' });
    loadData();
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!data) return <div className="p-8">Not found</div>;

  const { invoice, items, payments } = data;
  const isEditable = invoice.status === 'draft';
  const isPayable = invoice.status !== 'void' && invoice.balanceDueCents > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
           <Link href="/billing/invoices" className="text-sm text-gray-500 hover:text-gray-900">&larr; Back</Link>
           <h1 className="text-3xl font-bold text-gray-900 mt-2">{invoice.invoiceNumber}</h1>
           <p className="text-gray-500">To: {invoice.patientName} • {new Date(invoice.issuedDate).toLocaleDateString()}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
           <span className={`px-3 py-1 text-sm font-bold rounded-full uppercase
              ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
                invoice.status === 'void' ? 'bg-gray-100 text-gray-800' : 
                invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {invoice.status}
           </span>
           <div className="flex gap-2">
             <a href={`/api/invoices/${invoice.id}/print`} target="_blank" className="text-sm text-indigo-600 hover:underline">Print</a>
             {invoice.status === 'draft' && <button onClick={handleSend} className="text-sm text-blue-600 hover:underline">Mark Sent</button>}
             {invoice.status !== 'void' && <button onClick={handleVoid} className="text-sm text-red-600 hover:underline">Void</button>}
           </div>
        </div>
      </div>

      {/* Snapshot Info */}
      {invoice.medicalAidNameSnapshot && (
        <div className="bg-blue-50 p-4 rounded-md mb-6 text-sm text-blue-800">
           <strong>Medical Aid:</strong> {invoice.medicalAidNameSnapshot} ({invoice.medicalAidPlanSnapshot}) — #{invoice.medicalAidNumberSnapshot}
        </div>
      )}

      {/* Items */}
      <div className="bg-white shadow sm:rounded-lg overflow-hidden mb-6">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Line Items</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
             {items.map(item => (
               <tr key={item.id}>
                 <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                 <td className="px-6 py-4 text-sm text-gray-900 text-right">{item.quantity}</td>
                 <td className="px-6 py-4 text-sm text-gray-900 text-right">{(item.unitPriceCents/100).toFixed(2)}</td>
                 <td className="px-6 py-4 text-sm text-gray-900 text-right">{(item.lineSubtotalCents/100).toFixed(2)}</td>
                 <td className="px-6 py-4 text-right">
                   {isEditable && <button onClick={() => handleDeleteItem(item.id)} className="text-red-600 text-xs">Remove</button>}
                 </td>
               </tr>
             ))}
          </tbody>
        </table>
        
        {/* Add Item Form */}
        {isEditable && (
          <div className="bg-gray-50 p-4 border-t border-gray-200">
             <form onSubmit={handleAddItem} className="flex gap-4 items-end">
               <div className="flex-1">
                 <input placeholder="Description" required value={newItemDesc} onChange={e => setNewItemDesc(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm p-2 text-sm" />
               </div>
               <div className="w-20">
                 <input type="number" placeholder="Qty" required value={newItemQty} onChange={e => setNewItemQty(Number(e.target.value))} className="block w-full rounded-md border-gray-300 shadow-sm p-2 text-sm" />
               </div>
               <div className="w-24">
                 <input type="number" placeholder="Price" step="0.01" required value={newItemPrice} onChange={e => setNewItemPrice(Number(e.target.value))} className="block w-full rounded-md border-gray-300 shadow-sm p-2 text-sm" />
               </div>
               <button type="submit" disabled={addingItem} className="bg-indigo-600 text-white px-3 py-2 rounded-md text-sm">Add</button>
             </form>
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
         <div className="w-64 bg-white p-4 rounded shadow space-y-2">
            <div className="flex justify-between text-sm"><span>Subtotal:</span> <span>{(invoice.subtotalCents/100).toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span>Tax ({invoice.taxRate}%):</span> <span>{(invoice.taxCents/100).toFixed(2)}</span></div>
            <div className="flex justify-between font-bold border-t pt-2"><span>Total:</span> <span>{invoice.currency} {(invoice.totalCents/100).toFixed(2)}</span></div>
            <div className="flex justify-between text-sm text-green-700"><span>Paid:</span> <span>{(invoice.amountPaidCents/100).toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-red-700 border-t pt-2"><span>Due:</span> <span>{(invoice.balanceDueCents/100).toFixed(2)}</span></div>
         </div>
      </div>

      {/* Payments */}
      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
         <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Payments</h3>
         </div>
         <ul className="divide-y divide-gray-200">
            {payments.map(p => (
              <li key={p.id} className="px-4 py-4 flex justify-between">
                 <div>
                    <p className="text-sm font-medium text-gray-900">{p.method.toUpperCase()} - {p.reference || 'No Ref'}</p>
                    <p className="text-xs text-gray-500">{p.paymentDate} by {p.receiverName}</p>
                 </div>
                 <p className="text-sm font-bold text-green-700">
                    {(p.amountCents/100).toFixed(2)}
                 </p>
              </li>
            ))}
            {payments.length === 0 && <li className="px-4 py-4 text-sm text-gray-500">No payments recorded.</li>}
         </ul>

         {isPayable && (
            <div className="bg-gray-50 p-4 border-t border-gray-200">
               <h4 className="text-sm font-medium mb-2">Record Payment</h4>
               <form onSubmit={handleAddPayment} className="flex gap-4 items-end">
                  <div>
                    <select value={payMethod} onChange={e => setPayMethod(e.target.value as PaymentMethod)} className="block w-full rounded-md border-gray-300 shadow-sm p-2 text-sm">
                      <option value="cash">Cash</option>
                      <option value="eft">EFT</option>
                      <option value="card">Card</option>
                      <option value="medical_aid">Medical Aid</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <input type="number" placeholder="Amount" step="0.01" required value={payAmount} onChange={e => setPayAmount(Number(e.target.value))} className="block w-32 rounded-md border-gray-300 shadow-sm p-2 text-sm" />
                  </div>
                  <div className="flex-1">
                    <input type="text" placeholder="Reference (e.g. Auth Code)" value={payRef} onChange={e => setPayRef(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm p-2 text-sm" />
                  </div>
                  <button type="submit" disabled={addingPay} className="bg-green-600 text-white px-3 py-2 rounded-md text-sm">Pay</button>
               </form>
            </div>
         )}
      </div>
    </div>
  );
}

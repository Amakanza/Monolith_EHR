'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { InvoiceDetail } from '@/lib/types/billing';

export default function InvoiceDetailPage() {
  const params = useParams();
  const rawId = (params as any)?.id as string | string[] | undefined;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Item form
  const [desc, setDesc] = useState('');
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);
  const [addingItem, setAddingItem] = useState(false);

  // Payment form
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('cash');
  const [addingPay, setAddingPay] = useState(false);

  async function loadData(invoiceId: string) {
    const res = await fetch(`/api/invoices/${invoiceId}`);
    if (res.ok) setInvoice(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    if (!id) return;
    loadData(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    setAddingItem(true);
    await fetch(`/api/invoices/${invoice.id}/line-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: desc,
        quantity: qty,
        unitPriceCents: Math.round(price * 100),
      }),
    });

    setDesc('');
    setQty(1);
    setPrice(0);
    setAddingItem(false);

    if (id) loadData(id);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Delete item?')) return;
    await fetch(`/api/line-items/${itemId}`, { method: 'DELETE' });
    if (id) loadData(id);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    setAddingPay(true);
    await fetch(`/api/invoices/${invoice.id}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amountCents: Math.round(payAmount * 100),
        method: payMethod,
        paymentDate: new Date().toISOString().split('T')[0],
      }),
    });

    setPayAmount(0);
    setAddingPay(false);

    if (id) loadData(id);
  };

  if (loading || !invoice) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Link
            href="/app/billing/invoices"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            &larr; Back
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">{invoice.invoiceNumber}</h1>
          <p className="text-gray-500">
            Patient: {invoice.patient?.firstName} {invoice.patient?.lastName}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Status</div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium capitalize ${
              invoice.status === 'paid'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {invoice.status}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div>
          <div className="text-sm text-gray-500">Total</div>
          <div className="text-xl font-semibold">{(invoice.totalCents / 100).toFixed(2)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Paid</div>
          <div className="text-xl font-semibold text-green-700">
            {(invoice.amountPaidCents / 100).toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Balance Due</div>
          <div className="text-xl font-bold text-red-600">
            {(invoice.balanceCents / 100).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700">
          Line Items
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Description
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                Qty
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                Unit Price
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                Total
              </th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invoice.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 text-sm">{item.description}</td>
                <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                <td className="px-4 py-3 text-sm text-right">
                  {(item.unitPriceCents / 100).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-medium">
                  {(item.totalCents / 100).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Add Item Form */}
        <form
          onSubmit={handleAddItem}
          className="bg-gray-50 p-4 border-t border-gray-200 flex gap-2 items-end"
        >
          <div className="flex-grow">
            <input
              placeholder="Description"
              required
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full rounded border-gray-300 p-2 text-sm"
            />
          </div>
          <div className="w-20">
            <input
              type="number"
              placeholder="Qty"
              required
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="w-full rounded border-gray-300 p-2 text-sm"
            />
          </div>
          <div className="w-24">
            <input
              type="number"
              placeholder="Price"
              required
              step="0.01"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full rounded border-gray-300 p-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={addingItem}
            className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
          >
            Add
          </button>
        </form>
      </div>

      {/* Payments */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700">
          Payments
        </div>
        <ul className="divide-y divide-gray-200">
          {invoice.payments.length === 0 && (
            <li className="p-4 text-sm text-gray-500 text-center">No payments recorded.</li>
          )}
          {invoice.payments.map((p) => (
            <li key={p.id} className="px-4 py-3 flex justify-between items-center">
              <div className="text-sm">
                <span className="font-medium">{p.method}</span>
                <span className="text-gray-500 mx-2">•</span>
                <span className="text-gray-500">
                  {new Date(p.paymentDate).toLocaleDateString()}
                </span>
                {p.reference && <span className="text-gray-400 text-xs ml-2">({p.reference})</span>}
              </div>
              <div className="text-sm font-medium text-green-700">
                -{(p.amountCents / 100).toFixed(2)}
              </div>
            </li>
          ))}
        </ul>

        {/* Add Payment Form */}
        <form
          onSubmit={handlePayment}
          className="bg-gray-50 p-4 border-t border-gray-200 flex gap-2 items-end"
        >
          <div className="w-32">
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
              className="w-full rounded border-gray-300 p-2 text-sm"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="eft">EFT</option>
              <option value="medical_aid">Medical Aid</option>
            </select>
          </div>
          <div className="w-32">
            <input
              type="number"
              placeholder="Amount"
              step="0.01"
              required
              value={payAmount}
              onChange={(e) => setPayAmount(Number(e.target.value))}
              className="w-full rounded border-gray-300 p-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={addingPay}
            className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700"
          >
            Record Payment
          </button>
        </form>
      </div>
    </div>
  );
}

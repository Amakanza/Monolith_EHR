
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { OutboundMessage, MessageStatus } from '@/lib/types/communications';

export default function MessagesPage() {
  const { user } = useCurrentUser();
  const [messages, setMessages] = useState<OutboundMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<MessageStatus | ''>('');

  async function loadData() {
    if (!user?.activeClinicId) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    
    const res = await fetch(`/api/messages?${params.toString()}`);
    if (res.ok) {
      setMessages((await res.json()).messages);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [user?.activeClinicId, filterStatus]);

  const handleAction = async (id: string, action: 'cancel' | 'mark-sent' | 'mark-failed') => {
    if (!confirm(`Are you sure you want to ${action}?`)) return;
    let url = `/api/messages/${id}/`;
    if (action === 'cancel') url += 'cancel';
    if (action === 'mark-sent') url += 'mark-sent';
    if (action === 'mark-failed') url += 'mark-failed';

    await fetch(url, { method: 'POST', body: JSON.stringify({ reason: 'Manual update' }) });
    loadData();
  };

  if (!user?.activeClinicId) return <div className="p-8">Select a clinic.</div>;

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Outbound Messages</h1>
          <p className="mt-1 text-sm text-gray-500">History of SMS, Email, and WhatsApp messages.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link 
            href="/communications/templates"
            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Templates
          </Link>
          <Link
            href="/communications/new"
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            New Message
          </Link>
        </div>
      </div>

      <div className="mb-4">
        <select 
          value={filterStatus} 
          onChange={e => setFilterStatus(e.target.value as any)}
          className="rounded-md border-gray-300 shadow-sm text-sm"
        >
          <option value="">All Statuses</option>
          <option value="queued">Queued</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {loading ? <div className="p-4 text-center">Loading...</div> : 
           messages.length === 0 ? <div className="p-4 text-center text-gray-500">No messages found.</div> :
           messages.map(msg => (
            <li key={msg.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-indigo-600 truncate">
                    {msg.recipientName} <span className="text-gray-400">&lt;{msg.recipientContact}&gt;</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{msg.body}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {msg.channel.toUpperCase()} • Planned: {new Date(msg.plannedSendAt || msg.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                   <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${msg.status === 'sent' ? 'bg-green-100 text-green-800' : 
                        msg.status === 'failed' ? 'bg-red-100 text-red-800' : 
                        msg.status === 'queued' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                      {msg.status}
                   </span>
                   
                   {msg.status === 'queued' && (
                     <div className="flex gap-2 text-xs">
                        <button onClick={() => handleAction(msg.id, 'mark-sent')} className="text-green-600 hover:underline">Sent</button>
                        <button onClick={() => handleAction(msg.id, 'mark-failed')} className="text-red-600 hover:underline">Failed</button>
                        <button onClick={() => handleAction(msg.id, 'cancel')} className="text-gray-600 hover:underline">Cancel</button>
                     </div>
                   )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

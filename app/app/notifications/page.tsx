'use client';

import { useState, useEffect } from 'react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchNotifications() {
    const res = await fetch('/api/notifications');
    if (res.ok) setNotifications(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
    fetchNotifications();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Notifications</h1>

      <div className="bg-white rounded border shadow-sm divide-y">
        {loading ? (
          <div className="p-4 text-center">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No notifications.</div>
        ) : (
          notifications.map(n => (
            <div key={n.id} className={`p-4 flex justify-between items-start ${n.status === 'unread' ? 'bg-blue-50' : ''}`}>
              <div>
                <h3 className="font-semibold text-gray-900">{n.title}</h3>
                {n.body && <p className="text-sm text-gray-600 mt-1">{n.body}</p>}
                <p className="text-xs text-gray-400 mt-2">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              {n.status === 'unread' && (
                <button 
                  onClick={() => markRead(n.id)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Mark as read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

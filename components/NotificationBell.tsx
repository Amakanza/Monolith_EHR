
'use client';

import React, { useEffect, useState } from 'react';
import { StaffNotification } from '@/lib/types/communications';

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<StaffNotification[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchCount() {
    try {
      const res = await fetch('/api/notifications?countOnly=true');
      if (res.ok) {
        const data = await res.json();
        setCount(data.count);
      }
    } catch (e) {
      // ignore
    }
  }

  async function loadNotifications() {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCount();
    // Poll every 60s
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      loadNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' } : n));
    setCount(c => Math.max(0, c - 1));
  };

  return (
    <div className="relative">
      <button 
        onClick={handleToggle}
        className="relative p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <span className="sr-only">View notifications</span>
        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && (
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-red-400" />
        )}
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            <button onClick={() => setIsOpen(false)} className="text-xs text-gray-500 hover:text-gray-700">Close</button>
          </div>
          {loading ? (
             <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
          ) : notifications.length === 0 ? (
             <div className="p-4 text-center text-sm text-gray-500">No notifications.</div>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {notifications.map(n => (
                <li key={n.id} className={`px-4 py-3 hover:bg-gray-50 ${n.status === 'unread' ? 'bg-blue-50' : ''}`}>
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    {n.status === 'unread' && (
                      <button onClick={() => handleMarkRead(n.id)} className="text-xs text-indigo-600 hover:text-indigo-800">
                        Mark Read
                      </button>
                    )}
                  </div>
                  {n.body && <p className="text-sm text-gray-500 mt-1">{n.body}</p>}
                  <p className="text-xs text-gray-400 mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

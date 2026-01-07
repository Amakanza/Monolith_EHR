'use client';

import React, { useEffect, useState } from 'react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
  const { user, isLoading, mutate } = useCurrentUser();
  const router = useRouter();

  const [full_name, set_full_name] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user?.profile) {
      set_full_name(user.profile.full_name || '');
    }
  }, [user]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth/login');
    router.refresh();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: '', text: '' });

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name }),
      });

      if (!res.ok) throw new Error('Failed to update');

      await mutate();
      setMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch {
      setMsg({ type: 'error', text: 'An error occurred.' });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="p-8">Loading profile...</div>;

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-base font-semibold leading-6 text-gray-900">Account Settings</h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>Manage your personal details and session.</p>
        </div>

        <form onSubmit={handleUpdate} className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900">Email</label>
            <div className="mt-2">
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 bg-gray-100 sm:text-sm sm:leading-6 px-3"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900">Full Name</label>
            <div className="mt-2">
              <input
                type="text"
                value={full_name}
                onChange={(e) => set_full_name(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900">Global Role</label>
            <div className="mt-2">
              <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                {user?.profile?.global_role || 'standard_user'}
              </span>
            </div>
          </div>

          {msg.text && (
            <div className={`text-sm ${msg.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
              {msg.text}
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50"
            >
              Log out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

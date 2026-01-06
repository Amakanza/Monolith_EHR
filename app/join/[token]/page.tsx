
'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function PatientJoinPage() {
  const params = useParams();
  const [status, setStatus] = useState<'validating' | 'ready' | 'error' | 'joined'>('validating');
  const [errorMsg, setErrorMsg] = useState('');
  const [data, setData] = useState<{ joinUrl: string; sessionSummary: any } | null>(null);

  useEffect(() => {
    // We don't auto-join immediately to prevent accidental joins or bot triggers.
    // We fetch metadata first? 
    // Actually the current API validates AND returns URL.
    // Let's validate on load? Or wait for user click?
    // User click is better for "I am ready".
    // But we should verify token validity first to show "Invalid Link".
    // The current API does both. Let's just show "Click to Join" and handle errors then.
    setStatus('ready');
  }, []);

  const handleJoin = async () => {
    setStatus('validating');
    try {
      const res = await fetch('/api/telehealth/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: params.token })
      });
      
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.error || 'Join failed');
      }
      
      setData(json);
      setStatus('joined');
      
      // Redirect or Open
      window.location.href = json.joinUrl;
      
    } catch (e: any) {
      setStatus('error');
      let msg = 'Unable to join session.';
      if (e.message === 'INVALID_TOKEN') msg = 'This link is invalid.';
      if (e.message === 'TOKEN_EXPIRED') msg = 'This link has expired.';
      if (e.message === 'SESSION_ENDED') msg = 'The session has ended.';
      if (e.message === 'SESSION_INACTIVE') msg = 'The session is not active yet.';
      setErrorMsg(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Telehealth Appointment
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          {status === 'ready' && (
            <div>
              <p className="mb-6 text-gray-600">Please click below when you are ready to join the video call.</p>
              <button 
                onClick={handleJoin}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
              >
                Join Video Call
              </button>
            </div>
          )}

          {status === 'validating' && (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-gray-500">Connecting to session...</p>
            </div>
          )}

          {status === 'joined' && (
            <div>
              <p className="text-green-600 font-medium mb-2">Success!</p>
              <p className="text-gray-500">Redirecting to meeting...</p>
              <p className="text-xs text-gray-400 mt-4">If not redirected, <a href={data?.joinUrl} className="underline">click here</a>.</p>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <h3 className="text-red-800 font-medium">Access Denied</h3>
              <p className="text-red-600 mt-1">{errorMsg}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

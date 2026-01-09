
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function PublicJoinPage() {
  const { token } = useParams() as { token: string };
  const [status, setStatus] = useState<'validating' | 'ready' | 'error'>('validating');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    validateToken();
  }, [token]);

  async function validateToken() {
    try {
      const res = await fetch('/api/telehealth/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) throw new Error('Invalid session');
      
      const json = await res.json();
      setData(json);
      setStatus('ready');
    } catch (e) {
      setStatus('error');
    }
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Session Not Found</h1>
          <p className="text-gray-500">This link may be invalid or expired. Please contact your clinic.</p>
        </div>
      </div>
    );
  }

  if (status === 'validating') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to secure session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-900 text-white">
      <header className="p-4 bg-gray-800 flex justify-between items-center">
        <div className="font-semibold">Monolith Telehealth</div>
        {data?.appointment?.patients?.first_name && (
          <div className="text-sm text-gray-300">Welcome, {data.appointment.patients.first_name}</div>
        )}
      </header>
      
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center border-2 border-gray-700 relative overflow-hidden">
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="h-20 w-20 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold">Connected</h2>
              <p className="text-gray-400 mt-2">Waiting for clinician to join...</p>
            </div>
            
            {/* Mock Local Video */}
            <div className="absolute bottom-4 right-4 h-32 w-48 bg-black rounded border border-gray-600 flex items-center justify-center">
              <span className="text-xs text-gray-500">You</span>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button className="h-12 w-12 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center">
              🎤
            </button>
            <button className="h-12 w-12 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center">
              📷
            </button>
            <button 
              onClick={() => window.close()}
              className="h-12 w-12 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center"
            >
              📞
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

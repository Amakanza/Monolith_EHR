
'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AvailabilitySlot, PublicAppointmentType, PublicClinicProfile } from '@/lib/types/publicBooking';

type Step = 'service' | 'date' | 'details' | 'success';

export default function PublicBookingPage() {
  const params = useParams();
  const [profile, setProfile] = useState<PublicClinicProfile | null>(null);
  const [types, setTypes] = useState<PublicAppointmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>('service');
  const [error, setError] = useState('');

  // Selections
  const [selectedType, setSelectedType] = useState<PublicAppointmentType | null>(null);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [patient, setPatient] = useState({ firstName: '', lastName: '', cellNumber: '', email: '', idOrPassport: '' });
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [pRes, tRes] = await Promise.all([
          fetch(`/api/public/clinics/${params.slug}`),
          fetch(`/api/public/clinics/${params.slug}/appointment-types`)
        ]);
        
        if (!pRes.ok) throw new Error('Clinic not found');
        setProfile((await pRes.json()).profile);
        
        if (tRes.ok) setTypes((await tRes.json()).types);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.slug]);

  // Load slots when date changes
  useEffect(() => {
    async function loadSlots() {
      if (!selectedType || !date) return;
      setSlots([]); // clear old
      try {
        const res = await fetch(`/api/public/clinics/${params.slug}/availability?date=${date}&typeId=${selectedType.id}`);
        if (res.ok) {
          setSlots((await res.json()).slots);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadSlots();
  }, [date, selectedType, params.slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !selectedSlot) return;
    setSubmitting(true);
    
    try {
      const res = await fetch(`/api/public/clinics/${params.slug}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentTypeId: selectedType.id,
          startTime: selectedSlot.startTime,
          patient,
          notes,
          honeypot: '' // hidden field in real form would map here
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      
      setStep('success');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;
  if (error || !profile) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-600">{error || 'Error loading clinic'}</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-4">
          <h1 className="text-xl font-bold text-white">{profile.publicName}</h1>
          <p className="text-indigo-100 text-sm">{profile.address}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'service' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Select a Service</h2>
              <div className="space-y-3">
                {types.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setSelectedType(t); setStep('date'); }}
                    className="w-full text-left px-4 py-3 border rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors flex justify-between"
                  >
                    <span className="font-medium text-gray-800">{t.name}</span>
                    <span className="text-gray-500 text-sm">{t.defaultDurationMinutes} mins</span>
                  </button>
                ))}
                {types.length === 0 && <p className="text-gray-500">No services available for booking.</p>}
              </div>
            </div>
          )}

          {step === 'date' && selectedType && (
            <div>
              <button onClick={() => setStep('service')} className="text-sm text-gray-500 mb-4 hover:underline">&larr; Back</button>
              <h2 className="text-lg font-medium text-gray-900 mb-2">Select Date & Time</h2>
              <p className="text-sm text-gray-500 mb-4">Service: {selectedType.name}</p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input 
                  type="date" 
                  min={new Date().toISOString().split('T')[0]}
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  className="block w-full rounded-md border-gray-300 shadow-sm p-2 border" 
                />
              </div>

              {date && (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map(slot => (
                    <button
                      key={slot.startTime}
                      onClick={() => { setSelectedSlot(slot); setStep('details'); }}
                      className="px-2 py-2 text-sm border rounded hover:bg-indigo-600 hover:text-white transition-colors text-center"
                    >
                      {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </button>
                  ))}
                  {slots.length === 0 && <div className="col-span-3 text-center text-gray-500 text-sm py-4">No slots available.</div>}
                </div>
              )}
            </div>
          )}

          {step === 'details' && selectedSlot && selectedType && (
            <form onSubmit={handleSubmit}>
              <button type="button" onClick={() => setStep('date')} className="text-sm text-gray-500 mb-4 hover:underline">&larr; Back</button>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Your Details</h2>
              <div className="bg-indigo-50 p-3 rounded mb-6 text-sm text-indigo-900">
                <strong>{selectedType.name}</strong><br/>
                {new Date(selectedSlot.startTime).toLocaleString()}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">First Name *</label>
                    <input required value={patient.firstName} onChange={e => setPatient({...patient, firstName: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Last Name *</label>
                    <input required value={patient.lastName} onChange={e => setPatient({...patient, lastName: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Cell Number *</label>
                  <input required value={patient.cellNumber} onChange={e => setPatient({...patient, cellNumber: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Email (Optional)</label>
                  <input type="email" value={patient.email} onChange={e => setPatient({...patient, email: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Notes (Optional)</label>
                  <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-md font-semibold hover:bg-indigo-700 disabled:opacity-70"
              >
                {submitting ? 'Submitting...' : 'Confirm Booking'}
              </button>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
              <p className="text-gray-600">We have received your booking request.</p>
              <p className="text-sm text-gray-500 mt-4">You can close this page.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

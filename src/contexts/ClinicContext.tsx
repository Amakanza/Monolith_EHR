'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Clinic, ClinicRole } from '@/lib/types/clinics';

interface ClinicMember {
  membershipId: string;
  userId: string;
  role: ClinicRole;
  fullName: string;
}

interface ClinicContextType {
  // State
  clinics: Clinic[];
  activeClinicId: string | null;
  activeClinic: Clinic | null;
  myRoleInActiveClinic: ClinicRole | null;
  loading: boolean;
  error: string | null;
  
  // Members
  members: ClinicMember[];
  membersLoading: boolean;
  membersError: string | null;
  
  // Actions
  refreshClinics: () => Promise<void>;
  setActiveClinic: (clinicId: string) => Promise<boolean>;
  refreshMembers: (clinicId?: string) => Promise<void>;
  clearError: () => void;
  
  // Computed
  hasClinics: boolean;
  isAdmin: boolean;
  isOwner: boolean;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export function useClinic() {
  const context = useContext(ClinicContext);
  if (context === undefined) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
}

interface ClinicProviderProps {
  children: React.ReactNode;
  initialActiveClinicId?: string | null;
}

export function ClinicProvider({ children, initialActiveClinicId }: ClinicProviderProps) {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [activeClinicId, setActiveClinicIdState] = useState<string | null>(initialActiveClinicId || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [members, setMembers] = useState<ClinicMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);

  // Computed values
  const activeClinic = clinics.find(c => c.id === activeClinicId) || null;
  const myRoleInActiveClinic = members.find(m => m.userId === 'current-user')?.role || null; // This would be updated with actual user ID
  const hasClinics = clinics.length > 0;
  const isAdmin = myRoleInActiveClinic === 'admin' || myRoleInActiveClinic === 'owner';
  const isOwner = myRoleInActiveClinic === 'owner';

  // Refresh clinics list
  const refreshClinics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/clinics');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      setClinics(data.clinics || []);
      
      // If user has clinics but no active clinic set, set the first one
      if (data.clinics && data.clinics.length > 0 && !activeClinicId) {
        await setActiveClinicAction(data.clinics[0].id);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load clinics';
      setError(errorMessage);
      console.error('Failed to refresh clinics:', err);
    } finally {
      setLoading(false);
    }
  }, [activeClinicId]);

  // Set active clinic
  const setActiveClinicAction = useCallback(async (clinicId: string): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await fetch('/api/clinics/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }
      
      setActiveClinicIdState(clinicId);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch clinic';
      setError(errorMessage);
      console.error('Failed to set active clinic:', err);
      return false;
    }
  }, []);

  // Refresh members list
  const refreshMembers = useCallback(async (clinicId?: string) => {
    const targetClinicId = clinicId || activeClinicId;
    if (!targetClinicId) return;
    
    try {
      setMembersLoading(true);
      setMembersError(null);
      
      const response = await fetch(`/api/clinics/${targetClinicId}/members`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      setMembers(data.members || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load members';
      setMembersError(errorMessage);
      console.error('Failed to refresh members:', err);
    } finally {
      setMembersLoading(false);
    }
  }, [activeClinicId]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
    setMembersError(null);
  }, []);

  // Load clinics on mount
  useEffect(() => {
    refreshClinics();
  }, [refreshClinics]);

  // Load members when active clinic changes
  useEffect(() => {
    if (activeClinicId) {
      refreshMembers(activeClinicId);
    } else {
      setMembers([]);
    }
  }, [activeClinicId, refreshMembers]);

  // Update active clinic from server (for SSR/hydration sync)
  useEffect(() => {
    if (initialActiveClinicId && initialActiveClinicId !== activeClinicId) {
      setActiveClinicIdState(initialActiveClinicId);
    }
  }, [initialActiveClinicId, activeClinicId]);

  const value: ClinicContextType = {
    // State
    clinics,
    activeClinicId,
    activeClinic,
    myRoleInActiveClinic,
    loading,
    error,
    
    // Members
    members,
    membersLoading,
    membersError,
    
    // Actions
    refreshClinics,
    setActiveClinic: setActiveClinicAction,
    refreshMembers,
    clearError,
    
    // Computed
    hasClinics,
    isAdmin,
    isOwner,
  };

  return (
    <ClinicContext.Provider value={value}>
      {children}
    </ClinicContext.Provider>
  );
}
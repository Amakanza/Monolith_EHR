'use client';

import { useEffect, useState, useCallback } from 'react';

// Define the user type that includes both profile and auth info
export interface CurrentUserData {
  id: string;
  email: string;
  full_name: string | null;
  fullName: string | null;
  globalRole: string;
  global_role: string;
  avatarUrl: string | null;
  avatar_url: string | null;
  activeClinicId: string | null;
  active_clinic_id: string | null;
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState<Error | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsError(null);

      const res = await fetch('/api/me');

      if (!res.ok) {
        throw new Error('Failed to fetch current user');
      }

      const data: CurrentUserData = await res.json();
      setUser(data);
    } catch (err) {
      setIsError(err as Error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    isLoading,
    isError,
    mutate: fetchUser, // keeps same API as SWR
  };
}

import useSWR from 'swr';

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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useCurrentUser() {
  const { data, error, mutate, isLoading } = useSWR<CurrentUserData>(
    '/api/me',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    user: data,
    isLoading,
    isError: error,
    mutate,
  };
}

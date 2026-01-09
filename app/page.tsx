'use client';

import Link from 'next/link';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, isLoading } = useCurrentUser();
  const router = useRouter();

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <p className="text-gray-600">Loading...</p>
      </main>
    );
  }

  if (user) {
    router.push('/account');
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Monolith EHR</h1>
        <p className="mt-4 text-lg text-gray-600">Medical Practice Management System</p>
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/login"
            className="rounded-md bg-indigo-600 px-6 py-3 text-base font-semibold text-white hover:bg-indigo-500"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="rounded-md border-2 border-indigo-600 px-6 py-3 text-base font-semibold text-indigo-600 hover:bg-indigo-50"
          >
            Create Account
          </Link>
        </div>
      </div>
    </main>
  );
}
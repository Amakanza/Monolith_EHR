# Module 1: Auth & Users - Integration Guide

This module provides the core identity layer for the MediCore application. Future modules (Clinics, Patients, etc.) should rely on the exported types and helpers described below.

## 1. Protecting Server Pages/Routes

To protect a page or get the user context in a **Server Component**, use `ensureAuthenticatedServer`.

```tsx
import { ensureAuthenticatedServer } from '@/lib/services/authService';

export default async function ClinicDashboard() {
  // Will redirect to login if no session
  const user = await ensureAuthenticatedServer();
  
  return <h1>Hello, {user.fullName}</h1>;
}
```

If you just want to check optionally (without redirecting):
```tsx
import { getCurrentUserServer } from '@/lib/services/authService';

const user = await getCurrentUserServer(); // returns User | null
```

## 2. Accessing User in Client Components

Use the `useCurrentUser` hook. It fetches data from `/api/auth/me`.

```tsx
'use client';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

export function AppointmentButton() {
  const { user, isLoading } = useCurrentUser();

  if (isLoading) return <Spinner />;
  if (!user) return null;

  return <button>Book Appointment as {user.fullName}</button>;
}
```

## 3. The `CurrentUser` Type

The `CurrentUser` type is the contract between Auth and other modules.

```typescript
interface CurrentUser {
  id: string;        // UUID from auth.users
  email: string;
  fullName: string | null;
  globalRole: 'super_admin' | 'standard_user';
  avatarUrl: string | null;
}
```

## 4. Protected Layouts

If you are building a new section (e.g., `/patients`), prefer creating a layout in that folder that calls `ensureAuthenticatedServer()` if the entire section requires login. Or use the existing `app/(protected)/layout.tsx` if the route fits there.

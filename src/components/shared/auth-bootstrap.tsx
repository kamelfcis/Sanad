'use client';

import { useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import { useAuthStore, type AuthProfile } from '@/store/auth-store';

interface AuthBootstrapProps {
  initialUser: User | null;
  initialProfile: AuthProfile | null;
  children: React.ReactNode;
}

/**
 * Seeds the client auth store from the server session on first paint so
 * protected layouts don't block on a client getSession() round-trip.
 */
export function AuthBootstrap({ initialUser, initialProfile, children }: AuthBootstrapProps) {
  const seeded = useRef(false);

  if (!seeded.current && !useAuthStore.getState().sessionResolved) {
    useAuthStore.setState({
      user: initialUser,
      profile: initialProfile,
      isLoading: false,
      sessionResolved: true,
    });
    seeded.current = true;
  }

  return <>{children}</>;
}

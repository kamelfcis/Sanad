'use client';

import { useState } from 'react';
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
  // Lazy initializer runs exactly once during the first render, seeding the
  // external auth store before children paint without reading a ref during render.
  useState(() => {
    if (!useAuthStore.getState().sessionResolved) {
      useAuthStore.setState({
        user: initialUser,
        profile: initialProfile,
        isLoading: false,
        sessionResolved: true,
      });
    }
    return true;
  });

  return <>{children}</>;
}

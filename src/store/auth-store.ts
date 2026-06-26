import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';

export type AuthProfile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'customer' | 'technician' | 'admin';
  phone: string | null;
};

type AuthState = {
  user: User | null;
  profile: AuthProfile | null;
  isLoading: boolean;
  /** True after the initial getSession + profile hydration attempt has finished. */
  sessionResolved: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: AuthProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setSessionResolved: (resolved: boolean) => void;
  reset: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  sessionResolved: false,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  setSessionResolved: (sessionResolved) => set({ sessionResolved }),
  reset: () => set({ user: null, profile: null, isLoading: false, sessionResolved: true }),
}));

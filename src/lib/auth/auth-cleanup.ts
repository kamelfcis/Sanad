import type { QueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';

let queryClientRef: QueryClient | null = null;

export function registerQueryClient(client: QueryClient) {
  queryClientRef = client;
}

function getProjectRef() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return url.match(/https:\/\/([^.]+)/)?.[1];
}

export function clearSupabaseAuthCookies() {
  if (typeof document === 'undefined') return;

  const projectRef = getProjectRef();
  const cookieNames = document.cookie
    .split(';')
    .map((part) => part.split('=')[0]?.trim())
    .filter(Boolean) as string[];

  for (const name of cookieNames) {
    const isSupabaseAuthCookie =
      name.startsWith('sb-') || (projectRef ? name.includes(projectRef) : false);

    if (!isSupabaseAuthCookie) continue;

    document.cookie = `${name}=; Max-Age=0; path=/`;
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
  }
}

export function clearSupabaseAuthStorage() {
  if (typeof window === 'undefined') return;

  const projectRef = getProjectRef();

  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (key.startsWith('sb-') && key.includes('auth')) {
      localStorage.removeItem(key);
    }
    if (projectRef && key.includes(projectRef)) {
      localStorage.removeItem(key);
    }
  }

  for (let i = sessionStorage.length - 1; i >= 0; i--) {
    const key = sessionStorage.key(i);
    if (!key) continue;
    if (key.startsWith('sb-') && key.includes('auth')) {
      sessionStorage.removeItem(key);
    }
    if (projectRef && key.includes(projectRef)) {
      sessionStorage.removeItem(key);
    }
  }
}

export function clearRealtimeSubscriptions() {
  const supabase = createClient();
  supabase.removeAllChannels();
}

export function clearAppState() {
  clearRealtimeSubscriptions();
  clearSupabaseAuthStorage();
  clearSupabaseAuthCookies();

  if (queryClientRef) {
    queryClientRef.clear();
  }

  useAuthStore.getState().reset();
}

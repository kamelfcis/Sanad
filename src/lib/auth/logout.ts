import { createClient } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';
import { clearAppState } from '@/lib/auth/auth-cleanup';

export type LogoutScope = 'local' | 'global';

export type LogoutOptions = {
  scope?: LogoutScope;
  showToast?: boolean;
  redirectTo?: string;
  /** Skip server signOut (e.g. session already expired) */
  skipServer?: boolean;
};

const VOLUNTARY_LOGOUT_KEY = 'sanad:voluntary-logout';
const LOGOUT_SUCCESS_KEY = 'sanad:logout-success';

export function isVoluntaryLogout() {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(VOLUNTARY_LOGOUT_KEY) === '1';
  } catch {
    return false;
  }
}

export function markVoluntaryLogout() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(VOLUNTARY_LOGOUT_KEY, '1');
  } catch {
    // Ignore storage errors — cleanup still runs
  }
}

export function resetVoluntaryLogoutFlag() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(VOLUNTARY_LOGOUT_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function consumeLogoutSuccessToast() {
  if (typeof window === 'undefined') return false;
  try {
    if (sessionStorage.getItem(LOGOUT_SUCCESS_KEY) !== '1') return false;
    sessionStorage.removeItem(LOGOUT_SUCCESS_KEY);
    return true;
  } catch {
    return false;
  }
}

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 800;

async function signOutOnServer(scope: LogoutScope): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const response = await fetch('/api/auth/signout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope }),
      credentials: 'same-origin',
    });

    if (!response.ok) {
      console.warn('[logout] server signOut failed:', response.status);
    }
  } catch (err) {
    console.warn('[logout] server signOut error:', err);
  }
}

async function signOutWithRetry(scope: LogoutScope): Promise<void> {
  const supabase = createClient();

  await signOutOnServer(scope);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { error } = await supabase.auth.signOut({ scope });
      if (!error) return;
      if (attempt === MAX_RETRIES) {
        console.warn('[logout] signOut failed after retries:', error.message);
      }
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        console.warn('[logout] signOut error after retries:', err);
      }
    }

    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }
}

function applyLogoutTransition() {
  if (typeof document !== 'undefined') {
    document.body.classList.add('logout-fade-out');
  }
}

function queueLogoutSuccessToast() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(LOGOUT_SUCCESS_KEY, '1');
  } catch {
    toast({ title: 'تم تسجيل الخروج بنجاح' });
  }
}

export async function logout(options: LogoutOptions = {}): Promise<void> {
  const {
    scope = 'local',
    showToast = true,
    redirectTo = '/',
    skipServer = false,
  } = options;

  markVoluntaryLogout();
  applyLogoutTransition();

  if (!skipServer) {
    await signOutWithRetry(scope);
  }

  clearAppState();

  if (showToast) {
    queueLogoutSuccessToast();
  }

  await new Promise((r) => setTimeout(r, 150));

  if (typeof window !== 'undefined') {
    window.location.href = redirectTo;
  }
}

export async function handleSessionExpired(): Promise<void> {
  if (isVoluntaryLogout()) return;

  clearAppState();

  toast({
    title: 'انتهت صلاحية الجلسة',
    description: 'يرجى تسجيل الدخول مرة أخرى',
    variant: 'destructive',
  });

  if (typeof window !== 'undefined') {
    window.location.href = '/auth/login';
  }
}

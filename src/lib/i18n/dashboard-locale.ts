'use client';

import { useCallback, useEffect, useState } from 'react';

export type DashboardLocale = 'ar' | 'en';

const STORAGE_KEY = 'sanad_dashboard_locale';
const listeners = new Set<() => void>();

function readStoredLocale(): DashboardLocale {
  if (typeof window === 'undefined') return 'ar';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'en' ? 'en' : 'ar';
  } catch {
    return 'ar';
  }
}

export function useDashboardLocale() {
  const [locale, setLocaleState] = useState<DashboardLocale>('ar');

  useEffect(() => {
    const sync = () => setLocaleState(readStoredLocale());
    sync();
    listeners.add(sync);
    window.addEventListener('storage', sync);
    return () => {
      listeners.delete(sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const setLocale = useCallback((next: DashboardLocale) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
    setLocaleState(next);
    listeners.forEach((listener) => listener());
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'ar' ? 'en' : 'ar');
  }, [locale, setLocale]);

  return { locale, setLocale, toggleLocale, dir: locale === 'ar' ? ('rtl' as const) : ('ltr' as const) };
}

'use client';

import { create } from 'zustand';
import {
  ADMIN_LOCALE_COOKIE,
  ADMIN_LOCALE_STORAGE_KEY,
  DEFAULT_ADMIN_LOCALE,
  type AdminDirection,
  type AdminLocale,
} from './types';

function localeToDir(locale: AdminLocale): AdminDirection {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

function readStoredLocale(): AdminLocale {
  if (typeof window === 'undefined') return DEFAULT_ADMIN_LOCALE;
  try {
    const stored = localStorage.getItem(ADMIN_LOCALE_STORAGE_KEY);
    if (stored === 'ar' || stored === 'en') return stored;
  } catch {
    /* ignore */
  }
  return DEFAULT_ADMIN_LOCALE;
}

function persistLocale(locale: AdminLocale) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ADMIN_LOCALE_STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
  document.cookie = `${ADMIN_LOCALE_COOKIE}=${locale}; path=/admin; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

interface AdminLocaleState {
  locale: AdminLocale;
  dir: AdminDirection;
  hydrated: boolean;
  hydrate: () => void;
  setLocale: (locale: AdminLocale) => void;
}

export const useAdminLocaleStore = create<AdminLocaleState>((set) => ({
  locale: DEFAULT_ADMIN_LOCALE,
  dir: localeToDir(DEFAULT_ADMIN_LOCALE),
  hydrated: false,
  hydrate: () => {
    const locale = readStoredLocale();
    set({ locale, dir: localeToDir(locale), hydrated: true });
  },
  setLocale: (locale) => {
    persistLocale(locale);
    set({ locale, dir: localeToDir(locale) });
  },
}));

import arAdmin from '@/locales/ar/admin.json';
import enAdmin from '@/locales/en/admin.json';
import type { AdminDictionary, AdminLocale } from './types';

export const adminDictionaries: Record<AdminLocale, AdminDictionary> = {
  ar: arAdmin,
  en: enAdmin,
};

export function getAdminDictionary(locale: AdminLocale): AdminDictionary {
  return adminDictionaries[locale];
}

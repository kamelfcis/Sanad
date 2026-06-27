'use client';

import { cn } from '@/lib/utils/cn';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import type { AdminLocale } from '@/lib/i18n/admin/types';

export function AdminLanguageToggle() {
  const { locale, setLocale, t } = useAdminT();

  return (
    <div
      className="inline-flex items-center rounded-lg border border-zinc-200/80 bg-zinc-50/80 p-0.5 text-[11px] font-semibold"
      role="group"
      aria-label={t('header.languageToggle')}
      data-testid="admin-language-toggle"
    >
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={cn(
          'rounded-md px-2.5 py-1 transition-all',
          locale === 'en'
            ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200/80'
            : 'text-zinc-500 hover:text-zinc-800',
        )}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale('ar' as AdminLocale)}
        className={cn(
          'rounded-md px-2.5 py-1 transition-all',
          locale === 'ar'
            ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200/80'
            : 'text-zinc-500 hover:text-zinc-800',
        )}
      >
        ع
      </button>
    </div>
  );
}

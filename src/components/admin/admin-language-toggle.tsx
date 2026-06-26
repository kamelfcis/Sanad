'use client';

import { cn } from '@/lib/utils/cn';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import type { AdminLocale } from '@/lib/i18n/admin/types';

export function AdminLanguageToggle() {
  const { locale, setLocale, t } = useAdminT();

  return (
    <div
      className="flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white p-0.5 text-xs font-medium"
      role="group"
      aria-label={t('header.languageToggle')}
      data-testid="admin-language-toggle"
    >
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={cn(
          'rounded-md px-2.5 py-1 transition-colors',
          locale === 'en'
            ? 'bg-[#FF6B00] text-white'
            : 'text-[#64748B] hover:text-[#0F172A]',
        )}
      >
        🌐 {t('header.english')}
      </button>
      <span className="text-[#CBD5E1]">|</span>
      <button
        type="button"
        onClick={() => setLocale('ar' as AdminLocale)}
        className={cn(
          'rounded-md px-2.5 py-1 transition-colors',
          locale === 'ar'
            ? 'bg-[#FF6B00] text-white'
            : 'text-[#64748B] hover:text-[#0F172A]',
        )}
      >
        {t('header.arabic')}
      </button>
    </div>
  );
}

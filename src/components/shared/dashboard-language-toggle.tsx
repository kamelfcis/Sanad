'use client';

import { Button } from '@/components/ui/button';
import { useDashboardLocale } from '@/lib/i18n/dashboard-locale';
import { cn } from '@/lib/utils/cn';

interface DashboardLanguageToggleProps {
  className?: string;
}

export function DashboardLanguageToggle({ className }: DashboardLanguageToggleProps) {
  const { locale, setLocale } = useDashboardLocale();

  return (
    <div
      className={cn('inline-flex rounded-lg border border-border p-0.5 text-xs font-medium', className)}
      data-testid="dashboard-language-toggle"
    >
      <Button
        type="button"
        variant={locale === 'ar' ? 'default' : 'ghost'}
        size="sm"
        className="h-7 px-2.5"
        onClick={() => setLocale('ar')}
      >
        عربي
      </Button>
      <Button
        type="button"
        variant={locale === 'en' ? 'default' : 'ghost'}
        size="sm"
        className="h-7 px-2.5"
        onClick={() => setLocale('en')}
      >
        EN
      </Button>
    </div>
  );
}

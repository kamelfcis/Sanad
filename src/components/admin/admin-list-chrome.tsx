'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { LayoutGrid, LayoutList, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AdminListViewMode } from '@/hooks/use-admin-list-view';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { cn } from '@/lib/utils/cn';

export function AdminPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  if (actions) {
    return (
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A]">{title}</h1>
          {subtitle ? <p className="mt-1 text-[#64748B]">{subtitle}</p> : null}
        </div>
        {actions}
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold tracking-tight text-[#0F172A]">{title}</h1>
      {subtitle ? <p className="mt-1 text-[#64748B]">{subtitle}</p> : null}
    </div>
  );
}

export function AdminSearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  const { dir } = useAdminT();
  const isRtl = dir === 'rtl';

  return (
    <div className={cn('relative max-w-sm flex-1', className)}>
      <Search
        className={cn(
          'absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]',
          isRtl ? 'right-3' : 'left-3',
        )}
      />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'border-[#E2E8F0] bg-white shadow-sm focus-visible:ring-[#FF6B00]/30',
          isRtl ? 'pr-9' : 'pl-9',
        )}
      />
    </div>
  );
}

export function AdminFilterPills({
  filters,
  value,
  onChange,
}: {
  filters: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
      {filters.map((f) => (
        <button
          key={f.value}
          type="button"
          onClick={() => onChange(f.value)}
          className={cn(
            'shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
            value === f.value
              ? 'border-[#FF6B00] bg-[#FF6B00] text-white'
              : 'border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#FF6B00]/50',
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

export function AdminEmptyState({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[#E2E8F0] bg-white py-16 text-center shadow-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FF6B00]/10">
        <Icon className="h-7 w-7 text-[#FF6B00]" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-[#0F172A]">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-[#64748B]">{subtitle}</p> : null}
      </div>
    </div>
  );
}

export const adminPremiumActionClass =
  'text-[#FF6B00] hover:bg-[#FF6B00]/10 hover:text-[#FF6B00]';

export function AdminTableActionLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Button variant="ghost" size="sm" asChild className={adminPremiumActionClass}>
      <Link href={href}>{children}</Link>
    </Button>
  );
}

export const adminActionButtonClass =
  'text-[#64748B] hover:bg-[#FF6B00]/10 hover:text-[#FF6B00]';

export const adminActionButtonDestructiveClass =
  'text-destructive hover:bg-destructive/10 hover:text-destructive';

export function AdminListViewToggle({
  value,
  onChange,
  className,
}: {
  value: AdminListViewMode;
  onChange: (mode: AdminListViewMode) => void;
  className?: string;
}) {
  const { t } = useAdminT();

  return (
    <div
      role="group"
      aria-label={t('view.toggleLabel')}
      className={cn(
        'inline-flex rounded-xl border border-[#E2E8F0] bg-white p-1 shadow-sm',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange('table')}
        aria-pressed={value === 'table'}
        aria-label={t('view.toggleTable')}
        title={t('view.table')}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
          value === 'table'
            ? 'bg-[#FF6B00] text-white shadow-sm'
            : 'text-[#64748B] hover:bg-[#FF6B00]/10 hover:text-[#FF6B00]',
        )}
      >
        <LayoutList className="h-4 w-4" />
        <span className="hidden sm:inline">{t('view.table')}</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('cards')}
        aria-pressed={value === 'cards'}
        aria-label={t('view.toggleCards')}
        title={t('view.cards')}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
          value === 'cards'
            ? 'bg-[#FF6B00] text-white shadow-sm'
            : 'text-[#64748B] hover:bg-[#FF6B00]/10 hover:text-[#FF6B00]',
        )}
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden sm:inline">{t('view.cards')}</span>
      </button>
    </div>
  );
}

export function AdminEntityCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        'flex flex-col rounded-2xl border border-[#E2E8F0] bg-white p-4 text-center shadow-lg shadow-[#FF6B00]/10 transition-colors hover:border-[#FF6B00]/30 hover:bg-[#FF6B00]/[0.04] sm:text-start',
        className,
      )}
    >
      {children}
    </article>
  );
}

export function AdminEntityCardField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-[#94A3B8]">{label}</p>
      <div className="mt-0.5 text-sm">{children}</div>
    </div>
  );
}

export function AdminEntityCardActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mt-4 flex flex-wrap items-center justify-center gap-2 border-t border-[#E2E8F0]/80 pt-3 sm:justify-end',
        className,
      )}
    >
      {children}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { LayoutGrid, LayoutList, Search, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AdminListViewMode } from '@/hooks/use-admin-list-view';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { cn } from '@/lib/utils/cn';

export function AdminPageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
}) {
  const content = (
    <div className="min-w-0">
      {eyebrow ? (
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-[1.75rem]">
        {title}
      </h1>
      {subtitle ? <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-500">{subtitle}</p> : null}
    </div>
  );

  if (actions) {
    return (
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        {content}
        <div className="shrink-0">{actions}</div>
      </div>
    );
  }

  return <div className="mb-8">{content}</div>;
}

export function AdminSectionHeader({
  title,
  description,
  icon: Icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {Icon ? (
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF6B00]/10">
              <Icon className="h-3.5 w-3.5 text-[#FF6B00]" />
            </span>
          ) : null}
          <h2 className="text-sm font-semibold tracking-tight text-zinc-900">{title}</h2>
        </div>
        {description ? <p className="mt-1 text-xs text-zinc-500">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
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

export const adminFilterSelectClass =
  'flex h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]/30';

export function AdminAdvancedFiltersPanel({
  title,
  resetLabel,
  hasActiveFilters,
  activeCount = 0,
  onReset,
  defaultOpen,
  children,
}: {
  title: string;
  resetLabel: string;
  hasActiveFilters: boolean;
  activeCount?: number;
  onReset: () => void;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? hasActiveFilters);

  useEffect(() => {
    if (hasActiveFilters) setOpen(true);
  }, [hasActiveFilters]);

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-[#0F172A] transition-colors hover:bg-[#F8FAFC]"
        >
          <SlidersHorizontal className="h-4 w-4 text-[#FF6B00]" aria-hidden />
          {title}
          {activeCount > 0 ? (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF6B00] px-1.5 text-[11px] font-semibold text-white">
              {activeCount}
            </span>
          ) : null}
          <ChevronDown
            className={cn('h-4 w-4 text-[#64748B] transition-transform', open && 'rotate-180')}
            aria-hidden
          />
        </button>
        {hasActiveFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-[#64748B] hover:text-[#FF6B00]"
          >
            {resetLabel}
          </Button>
        ) : null}
      </div>
      {open ? (
        <div className="border-t border-[#E2E8F0] px-4 py-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
        </div>
      ) : null}
    </div>
  );
}

export function AdminFilterField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-xs font-medium text-[#64748B]">
        {label}
      </label>
      {children}
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

/** Full-height start-edge accent that curves with the card's rounded corners (RTL-safe). */
export const adminCardAccentClass =
  'pointer-events-none absolute inset-y-0 start-0 z-10 w-[5px] rounded-s-2xl bg-gradient-to-b from-[#FF6B00] to-[#FF8A34]';

export function AdminCardAccent({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn(adminCardAccentClass, className)} />;
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
        'group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200/70 bg-white ps-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:border-[#FF6B00]/25 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] sm:ps-7',
        className,
      )}
    >
      <AdminCardAccent />
      <div className="relative z-0 flex min-w-0 flex-1 flex-col p-5 sm:p-6">{children}</div>
    </article>
  );
}

export function AdminEntityCardHeader({
  title,
  subtitle,
  avatar,
  badge,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  avatar?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('flex items-start gap-3', className)}>
      {avatar ? <div className="shrink-0">{avatar}</div> : null}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <h3 className="text-base font-bold leading-snug tracking-tight text-[#0F172A]">{title}</h3>
          {badge ? <div className="shrink-0">{badge}</div> : null}
        </div>
        {subtitle ? <p className="mt-0.5 text-sm text-[#64748B]">{subtitle}</p> : null}
      </div>
    </header>
  );
}

export function AdminEntityCardAvatar({
  src,
  alt,
  fallback,
  className,
}: {
  src?: string | null;
  alt?: string;
  fallback?: React.ReactNode;
  className?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt ?? ''}
        className={cn(
          'h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-[#FF6B00]/10',
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B00]/15 to-[#FF8A34]/10 text-sm font-bold text-[#FF6B00] ring-2 ring-[#FF6B00]/10',
        className,
      )}
      aria-hidden={fallback ? undefined : true}
    >
      {fallback}
    </div>
  );
}

export function AdminEntityCardInfoBox({
  children,
  className,
  columns = 2,
}: {
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2;
}) {
  return (
    <div
      className={cn(
        'min-w-0 w-full rounded-xl border border-gray-100 bg-[#F8FAFC]/90 p-3.5 sm:p-4',
        columns === 2
          ? 'grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2'
          : 'flex flex-col gap-3',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AdminEntityCardInfoRow({
  label,
  children,
  className,
  fullWidth,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  /** Span both columns in a 2-column info box (e.g. email/phone). */
  fullWidth?: boolean;
}) {
  return (
    <div className={cn('min-w-0 overflow-hidden', fullWidth && 'sm:col-span-2', className)}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-[#94A3B8]">{label}</p>
      <div className="mt-1 min-w-0 overflow-hidden text-sm text-[#0F172A]">{children}</div>
    </div>
  );
}

/** LTR contact/value text (email, phone) — truncates safely inside RTL card grids. */
export function AdminEntityCardInfoLtrValue({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  const resolvedTitle =
    title ?? (typeof children === 'string' || typeof children === 'number' ? String(children) : undefined);

  return (
    <span
      dir="ltr"
      title={resolvedTitle}
      className={cn('block min-w-0 truncate text-start', className)}
    >
      {children}
    </span>
  );
}

export function AdminEntityCardMeta({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>{children}</div>
  );
}

const adminEntityCardMetaPillVariants = {
  muted: 'border-gray-100 bg-[#F1F5F9] text-[#64748B]',
  orange: 'border-[#FF6B00]/30 bg-[#FF6B00]/5 text-[#FF6B00]',
  success: 'border-emerald-200/80 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200/80 bg-amber-50 text-amber-700',
  danger: 'border-red-200/80 bg-red-50 text-red-700',
} as const;

export function AdminEntityCardMetaPill({
  children,
  variant = 'muted',
  className,
}: {
  children: React.ReactNode;
  variant?: keyof typeof adminEntityCardMetaPillVariants;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        adminEntityCardMetaPillVariants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function AdminEntityCardTagPill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-[#FF6B00]/35 bg-white px-2.5 py-0.5 text-xs font-medium text-[#FF6B00]',
        className,
      )}
    >
      {children}
    </span>
  );
}

/** @deprecated Prefer AdminEntityCardInfoRow inside AdminEntityCardInfoBox */
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
    <footer
      className={cn(
        'mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4',
        className,
      )}
    >
      {children}
    </footer>
  );
}

export function AdminEntityCardActionsGroup({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('flex items-center gap-2', className)}>{children}</div>;
}

export function AdminEntityCardPrimaryAction({
  href,
  onClick,
  children,
  icon: Icon,
  ariaLabel,
  className,
  external,
}: {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  icon?: LucideIcon;
  ariaLabel?: string;
  className?: string;
  external?: boolean;
}) {
  const classes = cn(
    'inline-flex items-center gap-1.5 rounded-full border border-[#FF6B00]/40 bg-white px-4 py-1.5 text-sm font-medium text-[#FF6B00] shadow-sm transition-colors hover:border-[#FF6B00] hover:bg-[#FF6B00]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]/30',
    className,
  );

  const content = (
    <>
      {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
      <span>{children}</span>
    </>
  );

  if (href) {
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={classes}
          aria-label={ariaLabel}
        >
          {content}
        </a>
      );
    }

    return (
      <Link href={href} className={classes} aria-label={ariaLabel}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes} aria-label={ariaLabel}>
      {content}
    </button>
  );
}

const adminEntityCardIconButtonVariants = {
  edit: 'border-blue-200/80 bg-blue-50 text-blue-600 hover:border-blue-300 hover:bg-blue-100 focus-visible:ring-blue-300/50',
  destructive:
    'border-red-200/80 bg-red-50 text-red-600 hover:border-red-300 hover:bg-red-100 focus-visible:ring-red-300/50',
  neutral:
    'border-gray-100 bg-[#F8FAFC] text-[#64748B] hover:border-[#FF6B00]/30 hover:bg-[#FF6B00]/5 hover:text-[#FF6B00] focus-visible:ring-[#FF6B00]/30',
} as const;

export function AdminEntityCardIconButton({
  onClick,
  icon: Icon,
  label,
  variant = 'neutral',
  disabled,
  className,
}: {
  onClick?: () => void;
  icon: LucideIcon;
  label: string;
  variant?: keyof typeof adminEntityCardIconButtonVariants;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50',
        adminEntityCardIconButtonVariants[variant],
        className,
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </button>
  );
}

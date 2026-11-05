'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  return (
    <div className={cn('mb-6', actions && 'flex items-center justify-between gap-4')}>
      <div>
        {eyebrow ? (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#FF6B00]">{eyebrow}</p>
        ) : null}
        <h1 className="text-3xl font-bold tracking-tight text-[#0F172A]">{title}</h1>
        {subtitle ? <p className="mt-1 text-[#64748B]">{subtitle}</p> : null}
      </div>
      {actions}
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

export const adminFilterSelectClass =
  'h-9 w-full rounded-md border border-input bg-background px-3 text-sm';

export function AdminListViewToggle({
  value,
  onChange,
}: {
  value: 'table' | 'cards';
  onChange: (mode: 'table' | 'cards') => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border p-1">
      <button
        type="button"
        className={cn('rounded-md px-3 py-1 text-xs font-medium', value === 'table' && 'bg-primary text-white')}
        onClick={() => onChange('table')}
      >
        Table
      </button>
      <button
        type="button"
        className={cn('rounded-md px-3 py-1 text-xs font-medium', value === 'cards' && 'bg-primary text-white')}
        onClick={() => onChange('cards')}
      >
        Cards
      </button>
    </div>
  );
}

export function AdminEntityCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('relative rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm', className)}>
      {children}
    </div>
  );
}

export function AdminEntityCardField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-[#64748B]">{label}</p>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}

export function AdminEntityCardHeader({
  title,
  subtitle,
  avatar,
  badge,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  avatar?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      {avatar}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-[#0F172A]">{title}</h3>
          {badge}
        </div>
        {subtitle ? <p className="text-sm text-[#64748B]">{subtitle}</p> : null}
      </div>
    </div>
  );
}

export function AdminEntityCardAvatar({
  src,
  alt,
  fallback,
}: {
  src?: string | null;
  alt: string;
  fallback: string;
}) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="h-10 w-10 rounded-full object-cover" />
  ) : (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF6B00]/10 text-xs font-bold text-[#FF6B00]">
      {fallback}
    </div>
  );
}

export function AdminEntityCardActions({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 flex flex-wrap items-center justify-between gap-2">{children}</div>;
}

export function AdminEntityCardActionsGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-1">{children}</div>;
}

export function AdminEntityCardIconButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className={cn(adminActionButtonClass, 'inline-flex h-8 w-8 items-center justify-center rounded-md')}
      {...props}
    >
      {children}
    </button>
  );
}

export function AdminEntityCardPrimaryAction({
  icon: Icon,
  onClick,
  children,
}: {
  icon?: LucideIcon;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button type="button" size="sm" onClick={onClick}>
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </Button>
  );
}

export function AdminEntityCardInfoBox({
  className,
  columns = 1,
  children,
}: {
  className?: string;
  columns?: number;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('grid gap-3', columns > 1 && 'sm:grid-cols-2', className)}>{children}</div>
  );
}

export function AdminEntityCardInfoRow({
  label,
  children,
  fullWidth,
}: {
  label: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? 'sm:col-span-2' : undefined}>
      <p className="text-xs text-[#64748B]">{label}</p>
      <div className="mt-0.5 text-sm">{children}</div>
    </div>
  );
}

export function AdminEntityCardInfoLtrValue({ children }: { children: React.ReactNode }) {
  return (
    <span dir="ltr" className="font-mono text-sm text-[#64748B]">
      {children}
    </span>
  );
}

export function AdminEntityCardMeta({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('flex flex-wrap gap-2', className)}>{children}</div>;
}

export function AdminEntityCardMetaPill({
  variant = 'orange',
  children,
}: {
  variant?: 'orange' | 'success' | 'danger' | string;
  children: React.ReactNode;
}) {
  const styles =
    variant === 'success'
      ? 'bg-emerald-50 text-emerald-700'
      : variant === 'danger'
        ? 'bg-red-50 text-red-700'
        : 'bg-[#FF6B00]/10 text-[#FF6B00]';
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', styles)}>
      {children}
    </span>
  );
}

export function AdminEntityCardTagPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{children}</span>
  );
}

export function AdminAdvancedFiltersPanel({
  title,
  resetLabel,
  hasActiveFilters,
  activeCount,
  onReset,
  children,
}: {
  title?: string;
  resetLabel?: string;
  hasActiveFilters?: boolean;
  activeCount?: number;
  onReset?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 rounded-xl border border-border bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">
          {title}
          {activeCount ? ` (${activeCount})` : ''}
        </p>
        {hasActiveFilters ? (
          <Button type="button" variant="ghost" size="sm" onClick={onReset}>
            {resetLabel}
          </Button>
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">{children}</div>
    </div>
  );
}

export function AdminFilterField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-[#64748B]">
        {label}
      </label>
      {children}
    </div>
  );
}

export function AdminCardAccent({ className }: { className?: string }) {
  return <div className={cn('absolute inset-x-0 top-0 h-1', className)} />;
}

export function AdminSectionHeader({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="mb-4 flex items-start gap-2">
      {Icon ? <Icon className="mt-0.5 h-5 w-5 text-[#FF6B00]" /> : null}
      <div>
        <h2 className="text-lg font-semibold text-[#0F172A]">{title}</h2>
        {description ? <p className="text-sm text-[#64748B]">{description}</p> : null}
      </div>
    </div>
  );
}

'use client';

import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { cn } from '@/lib/utils/cn';

export type MetadataValue = string | number | boolean | null | string[] | Record<string, unknown>;

interface AdminAuditLogDetailsProps {
  metadata: Record<string, MetadataValue>;
  entityType?: string;
  action?: string;
}

const statusColors: Record<string, string> = {
  verified: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/80',
  pending: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200/80',
  rejected: 'bg-red-100 text-red-700 ring-1 ring-red-200/80',
  suspended: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/80',
  unverified: 'bg-sky-100 text-sky-700 ring-1 ring-sky-200/80',
  approved: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/80',
  matched: 'bg-sky-100 text-sky-700 ring-1 ring-sky-200/80',
  accepted: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/80',
  in_progress: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200/80',
  completed: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/80',
  cancelled: 'bg-red-100 text-red-700 ring-1 ring-red-200/80',
  disputed: 'bg-orange-100 text-orange-700 ring-1 ring-orange-200/80',
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'border-0 px-2.5 py-0.5 text-xs font-medium capitalize',
        statusColors[status] ?? 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/80',
      )}
    >
      {label}
    </Badge>
  );
}

function MetadataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 rounded-lg bg-white/80 px-3 py-2 sm:grid-cols-[minmax(7rem,auto)_1fr] sm:items-baseline sm:gap-x-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-[#94A3B8]">{label}</dt>
      <dd className="min-w-0 text-sm">{value}</dd>
    </div>
  );
}

export function AdminAuditLogDetails({ metadata, entityType, action }: AdminAuditLogDetailsProps) {
  const { t, dir } = useAdminT();
  const isRtl = dir === 'rtl';

  if (!metadata || Object.keys(metadata).length === 0) return null;

  const hasTransition = metadata.from != null || metadata.to != null;
  const skipKeys = new Set(hasTransition ? ['from', 'to'] : []);

  const translateStatus = (value: string) => {
    if (entityType === 'technician' || action?.startsWith('technician_')) {
      const key = `technicians.status.${value}`;
      const translated = t(key);
      if (translated !== key) return translated;
    }
    if (entityType === 'booking' || action?.includes('booking')) {
      const key = `bookingStatus.${value}`;
      const translated = t(key);
      if (translated !== key) return translated;
    }
    if (action?.includes('payment')) {
      const key = `payments.status.${value}`;
      const translated = t(key);
      if (translated !== key) return translated;
    }
    return value.replace(/_/g, ' ');
  };

  const fieldLabel = (key: string): string => {
    const labelKey = `auditLogs.meta.${key}`;
    const translated = t(labelKey);
    return translated !== labelKey ? translated : key.replace(/_/g, ' ');
  };

  const formatValue = (key: string, value: MetadataValue): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-[#94A3B8]">{t('common.dash')}</span>;
    }

    if (typeof value === 'boolean') {
      return (
        <Badge
          variant="outline"
          className={cn(
            'border-0 text-xs',
            value ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600',
          )}
        >
          {value ? t('common.yes') : t('common.no')}
        </Badge>
      );
    }

    if (key === 'from' || key === 'to') {
      return (
        <StatusBadge status={String(value)} label={translateStatus(String(value))} />
      );
    }

    if (key === 'amount' && typeof value === 'number') {
      return (
        <span className="font-medium tabular-nums text-[#0F172A]" dir="ltr">
          {value.toLocaleString()}
        </span>
      );
    }

    if (key.endsWith('_id') || key === 'slug') {
      return (
        <code
          className="inline-block max-w-full truncate rounded-md bg-[#F1F5F9] px-2 py-0.5 text-xs font-mono text-[#64748B]"
          dir="ltr"
        >
          {String(value)}
        </code>
      );
    }

    if (Array.isArray(value)) {
      if (key === 'ordered_ids') {
        return (
          <span className="text-[#64748B]">
            {t('auditLogs.meta.itemsCount', { count: value.length })}
          </span>
        );
      }
      return (
        <span className="break-all text-[#64748B]" dir="ltr">
          {value.join(', ')}
        </span>
      );
    }

    if (key === 'payment_method') {
      const methodKey = `payments.methods.${String(value)}`;
      const translated = t(methodKey);
      return translated !== methodKey ? translated : String(value);
    }

    if (key === 'actor') {
      const actorKey = `auditLogs.meta.actors.${String(value)}`;
      const translated = t(actorKey);
      return translated !== actorKey ? translated : String(value);
    }

    return <span className="break-words text-[#0F172A]">{String(value)}</span>;
  };

  const rows: { key: string; label: string; value: React.ReactNode }[] = [];

  for (const [key, value] of Object.entries(metadata)) {
    if (skipKeys.has(key)) continue;

    if (isPlainObject(value)) {
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        rows.push({
          key: `${key}.${nestedKey}`,
          label: fieldLabel(nestedKey),
          value: formatValue(nestedKey, nestedValue as MetadataValue),
        });
      }
      continue;
    }

    rows.push({
      key,
      label: fieldLabel(key),
      value: formatValue(key, value),
    });
  }

  return (
    <details className="group mt-3">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-[#FF6B00] transition-colors hover:text-[#FF8A34] [&::-webkit-details-marker]:hidden">
        <ChevronDown className="h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-180" />
        {t('auditLogs.details')}
      </summary>

      <div className="mt-2 rounded-xl border border-[#E2E8F0] bg-gradient-to-br from-[#FF6B00]/[0.04] to-white p-3 shadow-sm">
        {hasTransition ? (
          <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-[#E2E8F0]/80 pb-3">
            <span className="text-xs font-medium text-[#64748B]">
              {t('auditLogs.meta.statusChange')}
            </span>
            {metadata.from != null ? (
              <StatusBadge
                status={String(metadata.from)}
                label={translateStatus(String(metadata.from))}
              />
            ) : (
              <span className="text-xs text-[#94A3B8]">{t('common.dash')}</span>
            )}
            {isRtl ? (
              <ArrowLeft className="h-4 w-4 shrink-0 text-[#FF6B00]" aria-hidden />
            ) : (
              <ArrowRight className="h-4 w-4 shrink-0 text-[#FF6B00]" aria-hidden />
            )}
            {metadata.to != null ? (
              <StatusBadge
                status={String(metadata.to)}
                label={translateStatus(String(metadata.to))}
              />
            ) : (
              <span className="text-xs text-[#94A3B8]">{t('common.dash')}</span>
            )}
          </div>
        ) : null}

        {rows.length > 0 ? (
          <dl className="grid gap-2">
            {rows.map((row) => (
              <MetadataRow key={row.key} label={row.label} value={row.value} />
            ))}
          </dl>
        ) : !hasTransition ? (
          <p className="text-xs text-[#94A3B8]">{t('auditLogs.meta.noDetails')}</p>
        ) : null}
      </div>
    </details>
  );
}

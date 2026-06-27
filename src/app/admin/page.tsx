'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Users,
  ClipboardList,
  CheckCircle,
  Clock,
  Wrench,
  Star,
  DollarSign,
  UserCog,
  FolderTree,
  Banknote,
  History,
  Settings,
  Images,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Activity,
  Minus,
  BarChart3,
  LayoutGrid,
} from 'lucide-react';
import { useAdminDashboard, EMPTY_DASHBOARD } from '@/hooks/use-admin';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AdminCardAccent,
  AdminEntityCard,
  AdminPageHeader,
  AdminSectionHeader,
} from '@/components/admin/admin-list-chrome';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { translateAdminError } from '@/lib/i18n/admin/translate-error';
import { BookingStatus } from '@/components/shared/booking-status';
import { cn } from '@/lib/utils/cn';

type TrendDirection = 'up' | 'down' | 'neutral';

type StatCardVariant =
  | 'revenue'
  | 'bookings'
  | 'pending'
  | 'rating'
  | 'technicians'
  | 'customers'
  | 'payments'
  | 'services';

const STAT_CARD_THEMES: Record<
  StatCardVariant,
  {
    card: string;
    border: string;
    hover: string;
    accent: string;
    iconWrap: string;
    icon: string;
    label: string;
    sub: string;
    highlightRing?: string;
    watermark: string;
  }
> = {
  revenue: {
    card: 'bg-gradient-to-br from-orange-50 via-amber-50/90 to-orange-100/80',
    border: 'border-orange-200/60',
    hover:
      'hover:-translate-y-0.5 hover:border-orange-300/80 hover:shadow-[0_8px_24px_rgba(255,107,0,0.14)]',
    accent: 'from-[#FF6B00] to-[#FF8A34]',
    iconWrap:
      'bg-gradient-to-br from-[#FF6B00] to-[#FF8A34] shadow-lg shadow-orange-500/30 ring-1 ring-orange-400/20',
    icon: 'text-white',
    label: 'text-orange-800/65',
    sub: 'text-orange-900/55',
    highlightRing: 'ring-2 ring-orange-300/45',
    watermark: 'text-orange-500',
  },
  bookings: {
    card: 'bg-gradient-to-br from-sky-50 via-blue-50/90 to-sky-100/75',
    border: 'border-sky-200/60',
    hover:
      'hover:-translate-y-0.5 hover:border-sky-300/80 hover:shadow-[0_8px_24px_rgba(14,165,233,0.14)]',
    accent: 'from-sky-500 to-blue-600',
    iconWrap:
      'bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/30 ring-1 ring-sky-400/20',
    icon: 'text-white',
    label: 'text-sky-800/65',
    sub: 'text-sky-900/55',
    watermark: 'text-sky-500',
  },
  pending: {
    card: 'bg-gradient-to-br from-rose-50 via-orange-50/80 to-rose-100/70',
    border: 'border-rose-200/60',
    hover:
      'hover:-translate-y-0.5 hover:border-rose-300/80 hover:shadow-[0_8px_24px_rgba(244,63,94,0.14)]',
    accent: 'from-rose-500 to-orange-500',
    iconWrap:
      'bg-gradient-to-br from-rose-500 to-orange-500 shadow-lg shadow-rose-500/30 ring-1 ring-rose-400/20',
    icon: 'text-white',
    label: 'text-rose-800/65',
    sub: 'text-rose-900/55',
    watermark: 'text-rose-500',
  },
  rating: {
    card: 'bg-gradient-to-br from-amber-50 via-yellow-50/90 to-amber-100/75',
    border: 'border-amber-200/60',
    hover:
      'hover:-translate-y-0.5 hover:border-amber-300/80 hover:shadow-[0_8px_24px_rgba(245,158,11,0.14)]',
    accent: 'from-amber-400 to-yellow-500',
    iconWrap:
      'bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg shadow-amber-500/30 ring-1 ring-amber-400/20',
    icon: 'text-white',
    label: 'text-amber-900/65',
    sub: 'text-amber-900/55',
    watermark: 'text-amber-500',
  },
  technicians: {
    card: 'bg-gradient-to-br from-emerald-50 via-green-50/90 to-emerald-100/75',
    border: 'border-emerald-200/60',
    hover:
      'hover:-translate-y-0.5 hover:border-emerald-300/80 hover:shadow-[0_8px_24px_rgba(16,185,129,0.14)]',
    accent: 'from-emerald-500 to-green-600',
    iconWrap:
      'bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/30 ring-1 ring-emerald-400/20',
    icon: 'text-white',
    label: 'text-emerald-800/65',
    sub: 'text-emerald-900/55',
    watermark: 'text-emerald-500',
  },
  customers: {
    card: 'bg-gradient-to-br from-violet-50 via-purple-50/90 to-violet-100/75',
    border: 'border-violet-200/60',
    hover:
      'hover:-translate-y-0.5 hover:border-violet-300/80 hover:shadow-[0_8px_24px_rgba(139,92,246,0.14)]',
    accent: 'from-violet-500 to-purple-600',
    iconWrap:
      'bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30 ring-1 ring-violet-400/20',
    icon: 'text-white',
    label: 'text-violet-800/65',
    sub: 'text-violet-900/55',
    watermark: 'text-violet-500',
  },
  payments: {
    card: 'bg-gradient-to-br from-rose-50 via-red-50/80 to-orange-100/65',
    border: 'border-rose-200/60',
    hover:
      'hover:-translate-y-0.5 hover:border-rose-300/80 hover:shadow-[0_8px_24px_rgba(244,63,94,0.14)]',
    accent: 'from-rose-500 to-red-500',
    iconWrap:
      'bg-gradient-to-br from-rose-500 to-red-500 shadow-lg shadow-rose-500/30 ring-1 ring-rose-400/20',
    icon: 'text-white',
    label: 'text-rose-800/65',
    sub: 'text-rose-900/55',
    watermark: 'text-rose-500',
  },
  services: {
    card: 'bg-gradient-to-br from-teal-50 via-cyan-50/90 to-teal-100/75',
    border: 'border-teal-200/60',
    hover:
      'hover:-translate-y-0.5 hover:border-teal-300/80 hover:shadow-[0_8px_24px_rgba(20,184,166,0.14)]',
    accent: 'from-teal-500 to-cyan-600',
    iconWrap:
      'bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/30 ring-1 ring-teal-400/20',
    icon: 'text-white',
    label: 'text-teal-800/65',
    sub: 'text-teal-900/55',
    watermark: 'text-teal-500',
  },
};

function computeBookingTrend(data: { date: string; count: number }[]): {
  direction: TrendDirection;
  percent: number;
} {
  if (data.length < 4) return { direction: 'neutral', percent: 0 };
  const recent = data.slice(-3).reduce((sum, d) => sum + d.count, 0);
  const previous = data.slice(-6, -3).reduce((sum, d) => sum + d.count, 0);
  if (previous === 0 && recent === 0) return { direction: 'neutral', percent: 0 };
  if (previous === 0) return { direction: 'up', percent: 100 };
  const change = ((recent - previous) / previous) * 100;
  if (Math.abs(change) < 1) return { direction: 'neutral', percent: 0 };
  return {
    direction: change > 0 ? 'up' : 'down',
    percent: Math.abs(Math.round(change)),
  };
}

function computeRevenueTrend(byMonth: { month: string; amount: number }[]): {
  direction: TrendDirection;
  percent: number;
} {
  if (byMonth.length < 2) return { direction: 'neutral', percent: 0 };
  const last = byMonth[byMonth.length - 1]?.amount ?? 0;
  const prev = byMonth[byMonth.length - 2]?.amount ?? 0;
  if (prev === 0 && last === 0) return { direction: 'neutral', percent: 0 };
  if (prev === 0) return { direction: 'up', percent: 100 };
  const change = ((last - prev) / prev) * 100;
  if (Math.abs(change) < 1) return { direction: 'neutral', percent: 0 };
  return {
    direction: change > 0 ? 'up' : 'down',
    percent: Math.abs(Math.round(change)),
  };
}

function TrendBadge({
  direction,
  percent,
  label,
}: {
  direction: TrendDirection;
  percent: number;
  label: string;
}) {
  const Icon =
    direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm',
        direction === 'up' && 'bg-white/75 text-emerald-700 ring-1 ring-emerald-200/60',
        direction === 'down' && 'bg-white/75 text-red-600 ring-1 ring-red-200/60',
        direction === 'neutral' && 'bg-white/70 text-zinc-500 ring-1 ring-zinc-200/60',
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {direction === 'neutral' ? label : `${percent}%`}
    </span>
  );
}

function PremiumStatCard({
  label,
  value,
  sub,
  icon: Icon,
  variant = 'revenue',
  highlight,
  trend,
  trendLabel,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: LucideIcon;
  variant?: StatCardVariant;
  highlight?: boolean;
  trend?: { direction: TrendDirection; percent: number };
  trendLabel?: string;
}) {
  const theme = STAT_CARD_THEMES[variant];

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-2xl border p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all duration-200',
        theme.card,
        theme.border,
        theme.hover,
        highlight && theme.highlightRing,
      )}
    >
      <AdminCardAccent className={theme.accent} />
      <Icon
        className={cn(
          'pointer-events-none absolute -end-3 -top-3 h-24 w-24 opacity-[0.08]',
          theme.watermark,
        )}
        aria-hidden
      />
      <div className="relative z-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className={cn('text-[11px] font-semibold uppercase tracking-wider', theme.label)}>
              {label}
            </p>
            <p className="mt-2 text-[1.65rem] font-semibold tabular-nums leading-none tracking-tight text-zinc-900">
              {value}
            </p>
          </div>
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
              theme.iconWrap,
            )}
          >
            <Icon className={cn('h-6 w-6', theme.icon)} aria-hidden />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {trend && trendLabel ? (
            <TrendBadge
              direction={trend.direction}
              percent={trend.percent}
              label={trendLabel}
            />
          ) : null}
          {sub ? <p className={cn('text-xs', theme.sub)}>{sub}</p> : null}
        </div>
      </div>
    </article>
  );
}

function ShortcutCard({
  href,
  label,
  icon: Icon,
  count,
  badge,
  variant = 'bookings',
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  count?: number;
  badge?: string;
  variant?: StatCardVariant;
}) {
  const theme = STAT_CARD_THEMES[variant];

  return (
    <Link
      href={href}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all duration-200',
        theme.card,
        theme.border,
        theme.hover,
      )}
    >
      <AdminCardAccent className={theme.accent} />
      <Icon
        className={cn(
          'pointer-events-none absolute -end-2 -top-2 h-16 w-16 opacity-[0.07]',
          theme.watermark,
        )}
        aria-hidden
      />
      <div className="relative z-0 flex items-center justify-between gap-2">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105',
            theme.iconWrap,
          )}
        >
          <Icon className={cn('h-5 w-5', theme.icon)} aria-hidden />
        </div>
        <ArrowUpRight className="h-3.5 w-3.5 text-zinc-400/80 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-zinc-700 rtl:group-hover:-translate-x-0.5" />
      </div>
      <p className="relative z-0 mt-3 text-sm font-medium text-zinc-800">{label}</p>
      <div className="relative z-0 mt-1 flex items-center gap-2">
        {count !== undefined ? (
          <span className="text-base font-semibold tabular-nums text-zinc-900">{count}</span>
        ) : null}
        {badge ? (
          <Badge
            variant="secondary"
            className="border-amber-200/80 bg-white/75 text-[11px] font-medium text-amber-700 backdrop-blur-sm hover:bg-white/75"
          >
            {badge}
          </Badge>
        ) : null}
      </div>
    </Link>
  );
}

function BarChart({
  data,
  title,
  description,
  noDataLabel,
  formatShortDate,
}: {
  data: { date: string; count: number }[];
  title: string;
  description?: string;
  noDataLabel: string;
  formatShortDate: (date: string) => string;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <AdminEntityCard className="text-start">
      <AdminSectionHeader title={title} description={description} icon={BarChart3} />
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-500">{noDataLabel}</p>
      ) : (
        <>
          <p className="mb-5 text-2xl font-semibold tabular-nums tracking-tight text-zinc-900">
            {total}
            <span className="ms-2 text-xs font-normal text-zinc-400">7d</span>
          </p>
          <div className="relative flex items-end gap-2" style={{ height: 140 }}>
            <div className="pointer-events-none absolute inset-x-0 inset-y-2 flex flex-col justify-between">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="border-t border-dashed border-zinc-100" />
              ))}
            </div>
            {data.map((d) => (
              <div key={d.date} className="relative flex flex-1 flex-col items-center gap-2">
                <span className="text-[10px] font-medium tabular-nums text-zinc-500">
                  {d.count > 0 ? d.count : ''}
                </span>
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="group/bar w-full cursor-default rounded-md bg-gradient-to-t from-[#FF6B00] to-[#FF8A34] transition-all hover:brightness-110"
                    style={{
                      height: `${Math.max((d.count / max) * 100, d.count > 0 ? 10 : 0)}%`,
                      minHeight: d.count > 0 ? 6 : 0,
                    }}
                    title={`${formatShortDate(d.date)}: ${d.count}`}
                  />
                </div>
                <span className="text-[10px] font-medium text-zinc-400">
                  {formatShortDate(d.date)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </AdminEntityCard>
  );
}

function RevenueChart({
  data,
  title,
  description,
  noDataLabel,
  formatCurrency,
}: {
  data: { month: string; amount: number }[];
  title: string;
  description?: string;
  noDataLabel: string;
  formatCurrency: (amount: number) => string;
}) {
  const slice = data.slice(-6);
  const max = Math.max(...slice.map((m) => m.amount), 1);

  return (
    <AdminEntityCard className="text-start">
      <AdminSectionHeader title={title} description={description} icon={DollarSign} />
      {slice.length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-500">{noDataLabel}</p>
      ) : (
        <div className="space-y-3">
          {slice.map((m) => (
            <div key={m.month} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-zinc-700">{m.month}</span>
                <span className="font-semibold tabular-nums text-zinc-900">
                  {formatCurrency(m.amount)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#FF6B00] to-[#FF8A34] transition-all"
                  style={{ width: `${Math.max((m.amount / max) * 100, m.amount > 0 ? 4 : 0)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminEntityCard>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <Skeleton className="mb-8 h-16 w-72" />
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { t, formatCurrency, formatShortDate, formatDateTime, locale } = useAdminT();
  const { data: analytics, isLoading, error } = useAdminDashboard();

  if (isLoading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {translateAdminError(error.message, t)}
        </div>
      </div>
    );
  }

  const d = analytics ?? EMPTY_DASHBOARD;
  const overview = d.overview ?? EMPTY_DASHBOARD.overview;
  const revenue = d.revenue ?? EMPTY_DASHBOARD.revenue;
  const shortcuts = d.shortcuts ?? EMPTY_DASHBOARD.shortcuts;
  const bookingTrends = d.booking_trends ?? [];
  const recentBookings = d.recent_bookings ?? [];
  const topTechnicians = d.top_technicians ?? [];
  const recentActivity = d.recent_activity ?? [];

  const bookingTrend = computeBookingTrend(bookingTrends);
  const revenueTrend = computeRevenueTrend(revenue.by_month);
  const trendStableLabel = t('dashboard.trendStable');

  const serviceName = (b: (typeof recentBookings)[0]) =>
    locale === 'ar' ? (b.service_name_ar ?? b.service_name) : b.service_name;

  const shortcutItems: {
    href: string;
    label: string;
    icon: LucideIcon;
    count?: number;
    badge?: string;
    variant: StatCardVariant;
  }[] = [
    {
      href: '/admin/bookings',
      label: t('nav.bookings'),
      icon: ClipboardList,
      count: shortcuts.bookings,
      variant: 'bookings',
      badge:
        overview.pending_bookings > 0
          ? t('dashboard.shortcuts.pendingCount', { count: overview.pending_bookings })
          : undefined,
    },
    {
      href: '/admin/customers',
      label: t('nav.customers'),
      icon: UserCog,
      count: shortcuts.customers,
      variant: 'customers',
    },
    {
      href: '/admin/technicians',
      label: t('nav.technicians'),
      icon: Users,
      count: shortcuts.technicians,
      variant: 'technicians',
      badge:
        overview.pending_technicians > 0
          ? t('dashboard.shortcuts.pendingCount', { count: overview.pending_technicians })
          : undefined,
    },
    {
      href: '/admin/services',
      label: t('nav.services'),
      icon: Wrench,
      count: shortcuts.services,
      variant: 'services',
    },
    {
      href: '/admin/categories',
      label: t('nav.categories'),
      icon: FolderTree,
      count: shortcuts.categories,
      variant: 'services',
    },
    {
      href: '/admin/payments',
      label: t('nav.payments'),
      icon: Banknote,
      count: shortcuts.payments,
      variant: 'payments',
      badge:
        overview.pending_payments > 0
          ? t('dashboard.shortcuts.pendingCount', { count: overview.pending_payments })
          : undefined,
    },
    {
      href: '/admin/reviews',
      label: t('nav.reviews'),
      icon: Star,
      count: shortcuts.reviews,
      variant: 'rating',
    },
    {
      href: '/admin/audit-logs',
      label: t('nav.auditLogs'),
      icon: History,
      count: shortcuts.audit_logs,
      variant: 'customers',
    },
    {
      href: '/admin/hero-slides',
      label: t('nav.heroSlides'),
      icon: Images,
      count: shortcuts.hero_slides,
      variant: 'revenue',
    },
    { href: '/admin/settings', label: t('nav.settings'), icon: Settings, variant: 'bookings' },
  ];

  const heroStats: {
    label: string;
    value: number | string;
    sub?: string;
    icon: LucideIcon;
    variant: StatCardVariant;
    highlight?: boolean;
    trend?: { direction: TrendDirection; percent: number };
  }[] = [
    {
      label: t('dashboard.stats.revenue'),
      value: formatCurrency(revenue.total),
      sub: t('dashboard.stats.approvedPayments', { count: overview.approved_payments }),
      icon: DollarSign,
      variant: 'revenue',
      highlight: true,
      trend: revenueTrend,
    },
    {
      label: t('dashboard.stats.totalBookings'),
      value: overview.total_bookings,
      sub: t('dashboard.stats.completed', { count: overview.completed_bookings }),
      icon: ClipboardList,
      variant: 'bookings',
      trend: bookingTrend,
    },
    {
      label: t('dashboard.stats.pending'),
      value: overview.pending_bookings,
      sub: t('dashboard.stats.inProgressSub', { count: overview.in_progress_bookings }),
      icon: Clock,
      variant: 'pending',
    },
    {
      label: t('dashboard.stats.avgRating'),
      value: overview.average_rating.toFixed(1),
      sub: t('dashboard.stats.reviewsCount', { count: overview.total_reviews }),
      icon: Star,
      variant: 'rating',
    },
  ];

  const secondaryStats: {
    label: string;
    value: number | string;
    sub?: string;
    icon: LucideIcon;
    variant: StatCardVariant;
  }[] = [
    {
      label: t('dashboard.stats.totalTechnicians'),
      value: overview.total_technicians,
      sub: t('dashboard.stats.verified', { count: overview.verified_technicians }),
      icon: Users,
      variant: 'technicians',
    },
    {
      label: t('dashboard.stats.totalCustomers'),
      value: overview.total_customers,
      icon: UserCog,
      variant: 'customers',
    },
    {
      label: t('dashboard.stats.pendingPayments'),
      value: overview.pending_payments,
      icon: Banknote,
      variant: 'payments',
    },
    {
      label: t('dashboard.stats.totalServices'),
      value: overview.total_services,
      sub: t('dashboard.stats.categoriesCount', { count: overview.total_categories }),
      icon: Wrench,
      variant: 'services',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <AdminPageHeader
        eyebrow={t('dashboard.eyebrow')}
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
      />

      <section className="mb-8">
        <AdminSectionHeader
          title={t('dashboard.heroMetrics')}
          description={t('dashboard.heroMetricsDesc')}
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {heroStats.map((s) => (
            <PremiumStatCard key={s.label} {...s} trendLabel={trendStableLabel} />
          ))}
        </div>
      </section>

      <section className="mb-8 grid gap-4 lg:grid-cols-2">
        <BarChart
          data={bookingTrends}
          title={t('charts.bookingsLast7Days')}
          description={t('dashboard.charts.bookingsDesc')}
          noDataLabel={t('charts.noData')}
          formatShortDate={(date) => formatShortDate(date)}
        />
        <RevenueChart
          data={revenue.by_month}
          title={t('charts.revenueMonthly')}
          description={t('dashboard.charts.revenueDesc')}
          noDataLabel={t('dashboard.noRevenue')}
          formatCurrency={formatCurrency}
        />
      </section>

      <section className="mb-8">
        <AdminSectionHeader
          title={t('dashboard.shortcuts.title')}
          description={t('dashboard.shortcuts.desc')}
          icon={LayoutGrid}
        />
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {shortcutItems.map((item) => (
            <ShortcutCard key={item.href} {...item} />
          ))}
        </div>
      </section>

      <section>
        <AdminSectionHeader title={t('dashboard.kpiTitle')} description={t('dashboard.kpiDesc')} />
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {secondaryStats.map((s) => (
            <PremiumStatCard key={s.label} {...s} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <AdminEntityCard className="text-start lg:col-span-1">
          <AdminSectionHeader title={t('dashboard.recentBookings')} />
          {recentBookings.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">{t('dashboard.noBookings')}</p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {recentBookings.map((b) => (
                <Link
                  key={b.id}
                  href={`/admin/bookings/${b.id}`}
                  className="flex items-center justify-between gap-3 py-3 transition-colors first:pt-0 last:pb-0 hover:bg-zinc-50/80"
                >
                  <div className="min-w-0 flex-1 px-1">
                    <p className="truncate text-sm font-medium text-zinc-900" dir="auto">
                      {serviceName(b)}
                    </p>
                    <p className="truncate text-xs text-zinc-500">{b.customer_name}</p>
                  </div>
                  <BookingStatus status={b.status} context="admin" />
                </Link>
              ))}
            </div>
          )}
        </AdminEntityCard>

        <AdminEntityCard className="text-start lg:col-span-1">
          <AdminSectionHeader title={t('dashboard.recentActivity')} icon={Activity} />
          {recentActivity.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">{t('dashboard.noActivity')}</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((log) => {
                const actionKey = `auditLogs.actions.${log.action}`;
                const actionLabel = t(actionKey);
                return (
                  <div
                    key={log.id}
                    className="rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2.5"
                  >
                    <p className="text-sm font-medium text-zinc-900">
                      {actionLabel === actionKey ? log.action : actionLabel}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {log.admin_name} · {formatDateTime(log.created_at)}
                    </p>
                  </div>
                );
              })}
              <Link
                href="/admin/audit-logs"
                className="mt-1 inline-flex text-xs font-medium text-[#FF6B00] hover:underline"
              >
                {t('dashboard.viewAllActivity')}
              </Link>
            </div>
          )}
        </AdminEntityCard>

        <AdminEntityCard className="text-start lg:col-span-1">
          <AdminSectionHeader title={t('dashboard.topTechnicians')} />
          {topTechnicians.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">{t('dashboard.noTechnicians')}</p>
          ) : (
            <div className="space-y-1">
              {topTechnicians.map((tech, i) => (
                <Link
                  key={tech.id}
                  href={`/admin/technicians/${tech.id}`}
                  className="flex items-center gap-3 rounded-lg px-1 py-2.5 transition-colors hover:bg-zinc-50/80"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600 ring-1 ring-zinc-200/80">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900">{tech.full_name}</p>
                    <p className="text-xs text-zinc-500">
                      {t('dashboard.jobsRating', {
                        jobs: tech.completed_jobs,
                        rating: tech.average_rating.toFixed(1),
                      })}
                    </p>
                  </div>
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                </Link>
              ))}
            </div>
          )}
        </AdminEntityCard>
      </div>
    </div>
  );
}

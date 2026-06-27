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
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
        direction === 'up' && 'bg-emerald-50 text-emerald-700',
        direction === 'down' && 'bg-red-50 text-red-600',
        direction === 'neutral' && 'bg-zinc-100 text-zinc-500',
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
  accent = 'from-[#FF6B00] to-[#FF8A34]',
  highlight,
  trend,
  trendLabel,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: LucideIcon;
  accent?: string;
  highlight?: boolean;
  trend?: { direction: TrendDirection; percent: number };
  trendLabel?: string;
}) {
  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:border-[#FF6B00]/25 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]',
        highlight && 'ring-1 ring-[#FF6B00]/15',
      )}
    >
      <AdminCardAccent className={accent} />
      <div className="relative z-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              {label}
            </p>
            <p className="mt-2 text-[1.65rem] font-semibold tabular-nums leading-none tracking-tight text-zinc-900">
              {value}
            </p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-50 ring-1 ring-zinc-100">
            <Icon className="h-[18px] w-[18px] text-[#FF6B00]" />
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
          {sub ? <p className="text-xs text-zinc-500">{sub}</p> : null}
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
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  count?: number;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-200/70 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:border-[#FF6B00]/30 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
    >
      <AdminCardAccent />
      <div className="relative z-0 flex items-center justify-between gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-50 ring-1 ring-zinc-100 transition-colors group-hover:bg-[#FF6B00]/10 group-hover:ring-[#FF6B00]/20">
          <Icon className="h-4 w-4 text-[#FF6B00]" />
        </div>
        <ArrowUpRight className="h-3.5 w-3.5 text-zinc-300 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#FF6B00] rtl:group-hover:-translate-x-0.5" />
      </div>
      <p className="relative z-0 mt-3 text-sm font-medium text-zinc-800">{label}</p>
      <div className="relative z-0 mt-1 flex items-center gap-2">
        {count !== undefined ? (
          <span className="text-base font-semibold tabular-nums text-zinc-900">{count}</span>
        ) : null}
        {badge ? (
          <Badge
            variant="secondary"
            className="border-amber-200/80 bg-amber-50 text-[11px] font-medium text-amber-700 hover:bg-amber-50"
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

  const shortcutItems = [
    {
      href: '/admin/bookings',
      label: t('nav.bookings'),
      icon: ClipboardList,
      count: shortcuts.bookings,
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
    },
    {
      href: '/admin/technicians',
      label: t('nav.technicians'),
      icon: Users,
      count: shortcuts.technicians,
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
    },
    {
      href: '/admin/categories',
      label: t('nav.categories'),
      icon: FolderTree,
      count: shortcuts.categories,
    },
    {
      href: '/admin/payments',
      label: t('nav.payments'),
      icon: Banknote,
      count: shortcuts.payments,
      badge:
        overview.pending_payments > 0
          ? t('dashboard.shortcuts.pendingCount', { count: overview.pending_payments })
          : undefined,
    },
    { href: '/admin/reviews', label: t('nav.reviews'), icon: Star, count: shortcuts.reviews },
    {
      href: '/admin/audit-logs',
      label: t('nav.auditLogs'),
      icon: History,
      count: shortcuts.audit_logs,
    },
    {
      href: '/admin/hero-slides',
      label: t('nav.heroSlides'),
      icon: Images,
      count: shortcuts.hero_slides,
    },
    { href: '/admin/settings', label: t('nav.settings'), icon: Settings },
  ];

  const heroStats = [
    {
      label: t('dashboard.stats.revenue'),
      value: formatCurrency(revenue.total),
      sub: t('dashboard.stats.approvedPayments', { count: overview.approved_payments }),
      icon: DollarSign,
      highlight: true,
      trend: revenueTrend,
    },
    {
      label: t('dashboard.stats.totalBookings'),
      value: overview.total_bookings,
      sub: t('dashboard.stats.completed', { count: overview.completed_bookings }),
      icon: ClipboardList,
      trend: bookingTrend,
    },
    {
      label: t('dashboard.stats.pending'),
      value: overview.pending_bookings,
      sub: t('dashboard.stats.inProgressSub', { count: overview.in_progress_bookings }),
      icon: Clock,
    },
    {
      label: t('dashboard.stats.avgRating'),
      value: overview.average_rating.toFixed(1),
      sub: t('dashboard.stats.reviewsCount', { count: overview.total_reviews }),
      icon: Star,
    },
  ];

  const secondaryStats = [
    {
      label: t('dashboard.stats.totalTechnicians'),
      value: overview.total_technicians,
      sub: t('dashboard.stats.verified', { count: overview.verified_technicians }),
      icon: Users,
    },
    {
      label: t('dashboard.stats.totalCustomers'),
      value: overview.total_customers,
      icon: UserCog,
    },
    {
      label: t('dashboard.stats.pendingPayments'),
      value: overview.pending_payments,
      icon: Banknote,
    },
    {
      label: t('dashboard.stats.totalServices'),
      value: overview.total_services,
      sub: t('dashboard.stats.categoriesCount', { count: overview.total_categories }),
      icon: Wrench,
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

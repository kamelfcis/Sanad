'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Users, ClipboardList, CheckCircle, Clock, Wrench, Star, DollarSign,
  UserCog, FolderTree, Banknote, History, Settings, Images, ShieldCheck,
  TrendingUp, ArrowUpRight, Activity,
} from 'lucide-react';
import { useAdminDashboard, EMPTY_DASHBOARD } from '@/hooks/use-admin';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AdminCardAccent,
  AdminEntityCard,
  AdminPageHeader,
} from '@/components/admin/admin-list-chrome';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { translateAdminError } from '@/lib/i18n/admin/translate-error';
import { BookingStatus } from '@/components/shared/booking-status';
import { cn } from '@/lib/utils/cn';

function PremiumStatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = 'from-[#FF6B00] to-[#FF8A34]',
  highlight,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: LucideIcon;
  accent?: string;
  highlight?: boolean;
}) {
  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-colors hover:border-[#FF6B00]/30 hover:shadow-md',
        highlight && 'ring-1 ring-[#FF6B00]/20',
      )}
    >
      <AdminCardAccent className={accent} />
      <div className="relative z-0 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-[#94A3B8]">{label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[#0F172A]">{value}</p>
          {sub ? <p className="mt-1 text-xs text-[#64748B]">{sub}</p> : null}
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FF6B00]/10">
          <Icon className="h-5 w-5 text-[#FF6B00]" />
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
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-[#FF6B00]/30 hover:bg-[#FF6B00]/[0.03] hover:shadow-md"
    >
      <AdminCardAccent />
      <div className="relative z-0 flex items-center justify-between gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF6B00]/10 transition-colors group-hover:bg-[#FF6B00]/15">
          <Icon className="h-5 w-5 text-[#FF6B00]" />
        </div>
        <ArrowUpRight className="h-4 w-4 text-[#94A3B8] opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <p className="mt-3 text-sm font-semibold text-[#0F172A]">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        {count !== undefined ? (
          <span className="text-lg font-bold tabular-nums text-[#FF6B00]">{count}</span>
        ) : null}
        {badge ? (
          <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-50">
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
  noDataLabel,
  formatShortDate,
}: {
  data: { date: string; count: number }[];
  title: string;
  noDataLabel: string;
  formatShortDate: (date: string) => string;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <AdminEntityCard className="text-start">
      <h3 className="mb-4 text-sm font-semibold text-[#0F172A]">{title}</h3>
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#64748B]">{noDataLabel}</p>
      ) : (
        <div className="flex items-end gap-1.5" style={{ height: 128 }}>
          {data.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-[10px] font-medium tabular-nums text-[#64748B]">{d.count || ''}</span>
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-[#FF6B00] to-[#FF8A34] transition-all hover:brightness-110"
                style={{ height: `${Math.max((d.count / max) * 100, d.count > 0 ? 8 : 0)}%`, minHeight: d.count > 0 ? 4 : 0 }}
              />
              <span className="text-[10px] text-[#94A3B8]">{formatShortDate(d.date)}</span>
            </div>
          ))}
        </div>
      )}
    </AdminEntityCard>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-4 sm:p-6">
      <Skeleton className="mb-6 h-10 w-64" />
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
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
      <div className="p-6">
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

  const serviceName = (b: (typeof recentBookings)[0]) =>
    locale === 'ar' ? (b.service_name_ar ?? b.service_name) : b.service_name;

  const shortcutItems = [
    { href: '/admin/bookings', label: t('nav.bookings'), icon: ClipboardList, count: shortcuts.bookings, badge: overview.pending_bookings > 0 ? t('dashboard.shortcuts.pendingCount', { count: overview.pending_bookings }) : undefined },
    { href: '/admin/customers', label: t('nav.customers'), icon: UserCog, count: shortcuts.customers },
    { href: '/admin/technicians', label: t('nav.technicians'), icon: Users, count: shortcuts.technicians, badge: overview.pending_technicians > 0 ? t('dashboard.shortcuts.pendingCount', { count: overview.pending_technicians }) : undefined },
    { href: '/admin/services', label: t('nav.services'), icon: Wrench, count: shortcuts.services },
    { href: '/admin/categories', label: t('nav.categories'), icon: FolderTree, count: shortcuts.categories },
    { href: '/admin/payments', label: t('nav.payments'), icon: Banknote, count: shortcuts.payments, badge: overview.pending_payments > 0 ? t('dashboard.shortcuts.pendingCount', { count: overview.pending_payments }) : undefined },
    { href: '/admin/reviews', label: t('nav.reviews'), icon: Star, count: shortcuts.reviews },
    { href: '/admin/audit-logs', label: t('nav.auditLogs'), icon: History, count: shortcuts.audit_logs },
    { href: '/admin/hero-slides', label: t('nav.heroSlides'), icon: Images, count: shortcuts.hero_slides },
    { href: '/admin/settings', label: t('nav.settings'), icon: Settings },
  ];

  const stats = [
    {
      label: t('dashboard.stats.totalBookings'),
      value: overview.total_bookings,
      sub: t('dashboard.stats.completed', { count: overview.completed_bookings }),
      icon: ClipboardList,
    },
    {
      label: t('dashboard.stats.revenue'),
      value: formatCurrency(revenue.total),
      sub: t('dashboard.stats.approvedPayments', { count: overview.approved_payments }),
      icon: DollarSign,
      highlight: true,
    },
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
    <div className="p-4 sm:p-6">
      <AdminPageHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />

      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[#FF6B00]" />
          <h2 className="text-sm font-semibold text-[#0F172A]">{t('dashboard.shortcuts.title')}</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {shortcutItems.map((item) => (
            <ShortcutCard key={item.href} {...item} />
          ))}
        </div>
      </section>

      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#FF6B00]" />
          <h2 className="text-sm font-semibold text-[#0F172A]">{t('dashboard.kpiTitle')}</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <PremiumStatCard key={s.label} {...s} />
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <BarChart
          data={bookingTrends}
          title={t('charts.bookingsLast7Days')}
          noDataLabel={t('charts.noData')}
          formatShortDate={(date) => formatShortDate(date)}
        />

        <AdminEntityCard className="text-start">
          <h3 className="mb-4 text-sm font-semibold text-[#0F172A]">{t('charts.revenueMonthly')}</h3>
          {revenue.by_month.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#64748B]">{t('dashboard.noRevenue')}</p>
          ) : (
            <div className="space-y-2">
              {revenue.by_month.slice(-6).map((m) => (
                <div
                  key={m.month}
                  className="flex items-center justify-between rounded-xl bg-[#F8FAFC] px-3 py-2.5"
                >
                  <span className="text-sm font-medium text-[#0F172A]">{m.month}</span>
                  <span className="text-sm font-semibold tabular-nums text-[#FF6B00]">
                    {formatCurrency(m.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </AdminEntityCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <AdminEntityCard className="text-start lg:col-span-1">
          <h3 className="mb-4 text-sm font-semibold text-[#0F172A]">{t('dashboard.recentBookings')}</h3>
          {recentBookings.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#64748B]">{t('dashboard.noBookings')}</p>
          ) : (
            <div className="space-y-1">
              {recentBookings.map((b) => (
                <Link
                  key={b.id}
                  href={`/admin/bookings/${b.id}`}
                  className="flex items-center justify-between gap-2 rounded-xl px-2 py-2.5 transition-colors hover:bg-[#FF6B00]/5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#0F172A]" dir="auto">
                      {serviceName(b)}
                    </p>
                    <p className="truncate text-xs text-[#64748B]">{b.customer_name}</p>
                  </div>
                  <BookingStatus status={b.status} context="admin" />
                </Link>
              ))}
            </div>
          )}
        </AdminEntityCard>

        <AdminEntityCard className="text-start lg:col-span-1">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#FF6B00]" />
            <h3 className="text-sm font-semibold text-[#0F172A]">{t('dashboard.recentActivity')}</h3>
          </div>
          {recentActivity.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#64748B]">{t('dashboard.noActivity')}</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((log) => {
                const actionKey = `auditLogs.actions.${log.action}`;
                const actionLabel = t(actionKey);
                return (
                <div key={log.id} className="rounded-xl bg-[#F8FAFC] px-3 py-2.5">
                  <p className="text-sm font-medium text-[#0F172A]">
                    {actionLabel === actionKey ? log.action : actionLabel}
                  </p>
                  <p className="mt-0.5 text-xs text-[#64748B]">
                    {log.admin_name} · {formatDateTime(log.created_at)}
                  </p>
                </div>
              );})}
              <Link
                href="/admin/audit-logs"
                className="mt-2 inline-flex text-xs font-medium text-[#FF6B00] hover:underline"
              >
                {t('dashboard.viewAllActivity')}
              </Link>
            </div>
          )}
        </AdminEntityCard>

        <AdminEntityCard className="text-start lg:col-span-1">
          <h3 className="mb-4 text-sm font-semibold text-[#0F172A]">{t('dashboard.topTechnicians')}</h3>
          {topTechnicians.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#64748B]">{t('dashboard.noTechnicians')}</p>
          ) : (
            <div className="space-y-2">
              {topTechnicians.map((tech, i) => (
                <Link
                  key={tech.id}
                  href={`/admin/technicians/${tech.id}`}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-[#FF6B00]/5"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FF6B00]/10 text-xs font-bold text-[#FF6B00]">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#0F172A]">{tech.full_name}</p>
                    <p className="text-xs text-[#64748B]">
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

'use client';

import { useAdminDashboard, EMPTY_DASHBOARD } from '@/hooks/use-admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users, ClipboardList, CheckCircle, Clock, Wrench,
  Star, DollarSign,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

function StatCard({ label, value, sub, icon: Icon, color, bg }: {
  label: string; value: number | string; sub?: string; icon: React.ElementType; color: string; bg: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${bg}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">
            {label}
            {sub && <span className="ml-1">— {sub}</span>}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function BarChart({ data, title }: { data: { date: string; count: number }[]; title: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No data yet.</p>
        ) : (
          <div className="flex items-end gap-1" style={{ height: 120 }}>
            {data.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-primary/80 transition-all hover:bg-primary"
                  style={{ height: `${(d.count / max) * 100}%` }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(d.date), 'MM/dd')}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { data: analytics, isLoading, error } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load dashboard data.
        </div>
      </div>
    );
  }

  const d = analytics ?? EMPTY_DASHBOARD;
  const overview = d.overview ?? EMPTY_DASHBOARD.overview;
  const revenue = d.revenue ?? EMPTY_DASHBOARD.revenue;
  const bookingTrends = d.booking_trends ?? [];
  const recentBookings = d.recent_bookings ?? [];
  const topTechnicians = d.top_technicians ?? [];

  const stats = [
    { label: 'Total Technicians', value: overview.total_technicians, sub: `${overview.verified_technicians} verified`, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-950' },
    { label: 'Total Customers', value: overview.total_customers, icon: Users, color: 'text-teal-600', bg: 'bg-teal-100 dark:bg-teal-950' },
    { label: 'Total Bookings', value: overview.total_bookings, sub: `${overview.completed_bookings} completed`, icon: ClipboardList, color: 'text-violet-600', bg: 'bg-violet-100 dark:bg-violet-950' },
    { label: 'Pending', value: overview.pending_bookings, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-950' },
    { label: 'In Progress', value: overview.in_progress_bookings, icon: Wrench, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-950' },
    { label: 'Completed', value: overview.completed_bookings, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-950' },
    { label: 'Avg Rating', value: overview.average_rating.toFixed(1), sub: `${overview.total_reviews} reviews`, icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-950' },
    { label: 'Revenue', value: `SAR ${revenue.total.toLocaleString()}`, icon: DollarSign, color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-950' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Platform overview and analytics.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <BarChart data={bookingTrends} title="Bookings (Last 7 Days)" />

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Revenue (Monthly)</CardTitle>
          </CardHeader>
          <CardContent>
            {revenue.by_month.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No revenue data yet.</p>
            ) : (
              <div className="space-y-2">
                {revenue.by_month.slice(-6).map((m) => (
                  <div key={m.month} className="flex items-center justify-between rounded-md bg-muted/50 p-2">
                    <span className="text-sm font-medium">{m.month}</span>
                    <span className="text-sm text-muted-foreground">SAR {m.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No bookings yet.</p>
            ) : (
              <div className="space-y-2">
                {recentBookings.map((b) => (
                  <Link
                    key={b.id}
                    href={`/admin/bookings/${b.id}`}
                    className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" dir="auto">{b.service_name}</p>
                      <p className="text-xs text-muted-foreground">{b.customer_name}</p>
                    </div>
                    <span className="ml-2 shrink-0 text-xs capitalize text-muted-foreground">{b.status}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top Technicians</CardTitle>
          </CardHeader>
          <CardContent>
            {topTechnicians.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No technicians yet.</p>
            ) : (
              <div className="space-y-2">
                {topTechnicians.map((t, i) => (
                  <div key={t.id} className="flex items-center gap-3 rounded-md p-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{t.full_name}</p>
                      <p className="text-xs text-muted-foreground">{t.completed_jobs} jobs · {t.average_rating.toFixed(1)}★</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

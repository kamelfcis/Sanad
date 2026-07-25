'use client';

import Link from 'next/link';
import { Wallet, Clock, CheckCircle2, ArrowRight, Receipt } from 'lucide-react';
import { useTechnicianEarnings } from '@/hooks/use-technician';
import { useFormatMoney } from '@/hooks/use-site-settings';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const PAYMENT_STATUS: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'secondary' | 'destructive' }
> = {
  approved: { label: 'مدفوع', variant: 'success' },
  pending: { label: 'قيد المراجعة', variant: 'warning' },
  rejected: { label: 'مرفوض', variant: 'destructive' },
  unpaid: { label: 'غير مدفوع', variant: 'secondary' },
};

function formatArabicDate(value: string): string {
  return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(new Date(value));
}

export default function TechnicianEarningsPage() {
  const { data, isLoading, isError, error, refetch } = useTechnicianEarnings();
  const { formatMoney } = useFormatMoney();

  return (
    <div className="container py-8" dir="rtl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الأرباح</h1>
          <p className="mt-1 text-muted-foreground">تابع أرباحك من الطلبات المكتملة والمدفوعات.</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/technician/jobs" className="gap-2">
            <ArrowRight className="h-4 w-4" />
            العودة إلى الطلبات
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : 'تعذّر تحميل الأرباح.'}
            </p>
            <Button onClick={() => void refetch()}>إعادة المحاولة</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10">
                  <Wallet className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">إجمالي الأرباح</p>
                  <p className="text-2xl font-black">{formatMoney(Math.round(data?.totalEarned ?? 0))}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">قيد التحصيل</p>
                  <p className="text-2xl font-black">{formatMoney(Math.round(data?.totalPending ?? 0))}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">الطلبات المكتملة</p>
                  <p className="text-2xl font-black">{data?.completedJobs ?? 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Per-job breakdown */}
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-semibold">تفاصيل الأرباح</h2>
            {!data || data.jobs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                  <Receipt className="h-8 w-8 text-muted-foreground/30" />
                  <div>
                    <p className="text-sm font-medium">لا توجد أرباح بعد</p>
                    <p className="text-xs text-muted-foreground">
                      ستظهر أرباحك هنا بعد إتمام الطلبات وتأكيد المدفوعات.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {data.jobs.map((job) => {
                  const badge = PAYMENT_STATUS[job.paymentStatus] ?? PAYMENT_STATUS.unpaid;
                  return (
                    <Card key={job.bookingId}>
                      <CardContent className="flex items-center justify-between gap-4 p-4">
                        <div className="min-w-0">
                          <Link
                            href={`/technician/jobs/${job.bookingId}`}
                            className="truncate font-medium hover:text-primary"
                          >
                            {job.serviceName ?? 'خدمة'}
                          </Link>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatArabicDate(job.createdAt)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <Badge variant={badge.variant} className="text-xs font-semibold">
                            {badge.label}
                          </Badge>
                          <span className="font-bold">{formatMoney(Math.round(job.amount))}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

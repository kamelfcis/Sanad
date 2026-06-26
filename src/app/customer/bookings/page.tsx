'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useBookings } from '@/hooks/use-bookings';
import { BookingCard } from '@/components/shared/booking-card';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { PageLoading } from '@/components/shared/page-loading';
import { PageTransition } from '@/components/animations';
import { Button } from '@/components/ui/button';
import { Plus, Calendar } from 'lucide-react';

const statusFilters = [
  { label: 'الكل', value: '' },
  { label: 'قيد الانتظار', value: 'pending' },
  { label: 'جاري التنفيذ', value: 'in_progress' },
  { label: 'مكتمل', value: 'completed' },
  { label: 'ملغي', value: 'cancelled' },
];

export default function CustomerBookingsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const { data: bookings, isLoading, error, refetch } = useBookings(statusFilter || undefined);

  return (
    <PageTransition className="container py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">حجوزاتي</h1>
          <p className="mt-1 text-muted-foreground">تابع وأدر طلبات الخدمة الخاصة بك.</p>
        </div>
        <Button asChild>
          <Link href="/customer/bookings/new">
            <Plus className="ml-2 h-4 w-4" />
            حجز جديد
          </Link>
        </Button>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatusFilter(f.value)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border hover:border-muted-foreground/50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <PageLoading variant="list" />
      ) : error ? (
        <ErrorState
          title="تعذّر تحميل الحجوزات"
          onRetry={() => refetch()}
        />
      ) : bookings?.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="لا توجد حجوزات"
          description={
            statusFilter
              ? `لا توجد حجوزات بحالة "${statusFilters.find((f) => f.value === statusFilter)?.label}".`
              : 'احجز أول خدمة للبدء.'
          }
          action={
            !statusFilter ? (
              <Button asChild>
                <Link href="/customer/bookings/new">
                  <Plus className="ml-2 h-4 w-4" />
                  احجز خدمة
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {bookings?.map((booking) => (
            <BookingCard key={booking.id} {...booking} />
          ))}
        </div>
      )}
    </PageTransition>
  );
}

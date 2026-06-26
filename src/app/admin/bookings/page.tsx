'use client';

import { useState } from 'react';
import { useAdminBookings } from '@/hooks/use-admin';
import { BookingStatus } from '@/components/shared/booking-status';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { format } from 'date-fns';

const statusFilters = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Matched', value: 'matched' },
  { label: 'Active', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function AdminBookingsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const { data: bookings, isLoading, error } = useAdminBookings(statusFilter || undefined);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
        <p className="mt-1 text-muted-foreground">View and manage all service requests on the platform.</p>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              'shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              statusFilter === f.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border hover:border-muted-foreground/50',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load bookings.
        </div>
      ) : !bookings || bookings.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <ClipboardList className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">No bookings found</h2>
            <p className="text-sm text-muted-foreground">
              {statusFilter ? `No bookings with status "${statusFilter}".` : 'No bookings have been created yet.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Service</th>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-left font-medium">Technician</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="hidden px-4 py-3 text-left font-medium md:table-cell">Date</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3" dir="auto">
                    <p className="truncate font-medium">{b.services?.name_ar ?? 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{b.services?.name_en}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {b.customer?.full_name ?? b.customer_id.slice(0, 8) + '...'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {b.technician?.full_name ?? (b.technician_id ? `${b.technician_id.slice(0, 8)}...` : '—')}
                  </td>
                  <td className="px-4 py-3"><BookingStatus status={b.status} /></td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {format(new Date(b.created_at), 'MMM d, h:mm a')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/bookings/${b.id}`}>View</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

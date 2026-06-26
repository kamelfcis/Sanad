'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react';
import Link from 'next/link';
import { useAdminTechniciansList } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  verified: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  suspended: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  unverified: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
};

export default function AdminTechniciansPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useAdminTechniciansList(search, page);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Technicians</h1>
        <p className="mt-1 text-muted-foreground">Manage technician registrations and statuses.</p>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search technicians..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load technicians.
        </div>
      ) : !data?.technicians.length ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Users className="h-12 w-12 text-muted-foreground/50" />
          <h2 className="text-lg font-semibold">No technicians found</h2>
          <p className="text-sm text-muted-foreground">No technicians match your search.</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Jobs</th>
                  <th className="hidden px-4 py-3 text-left font-medium md:table-cell">Rating</th>
                  <th className="hidden px-4 py-3 text-left font-medium md:table-cell">Joined</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.technicians.map((t: any) => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{t.full_name ?? 'Unnamed'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.email ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={statusColors[t.verification_status] ?? ''}>
                        {t.verification_status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{t.completed_jobs ?? 0}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {t.average_rating ? `${Number(t.average_rating).toFixed(1)}★` : '—'}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {t.created_at ? format(new Date(t.created_at), 'MMM d, yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/technicians/${t.id}`}>View</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {data.page} of {Math.ceil(data.total / data.limit)} ({data.total} total)
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page * data.limit >= data.total} onClick={() => setPage(page + 1)}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

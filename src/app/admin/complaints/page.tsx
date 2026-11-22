'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type ComplaintStatus = 'open' | 'reviewing' | 'closed';

interface ComplaintRow {
  id: string;
  body: string;
  status: ComplaintStatus;
  admin_notes: string | null;
  created_at: string;
  customer: { full_name: string | null; phone: string | null } | null;
  technician: { full_name: string | null; phone: string | null } | null;
  booking: { id: string; status: string } | null;
}

async function fetchComplaints(status?: ComplaintStatus) {
  const params = new URLSearchParams({ page: '1', limit: '50' });
  if (status) params.set('status', status);
  const res = await fetch(`/api/admin/complaints?${params}`);
  if (!res.ok) throw new Error('تعذّر تحميل الشكاوى');
  return res.json() as Promise<{ complaints: ComplaintRow[]; total: number }>;
}

export default function AdminComplaintsPage() {
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'all'>('open');
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-complaints', statusFilter],
    queryFn: () => fetchComplaints(statusFilter === 'all' ? undefined : statusFilter),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: ComplaintStatus;
    }) => {
      const res = await fetch(`/api/admin/complaints/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'فشل التحديث');
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-complaints'] });
      toast({ title: 'تم تحديث حالة الشكوى' });
    },
    onError: (err: Error) => {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    },
  });

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">الشكاوى</h1>
          <p className="text-sm text-muted-foreground">مراجعة شكاوى العملاء على الحجوزات</p>
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as ComplaintStatus | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="open">مفتوحة</SelectItem>
            <SelectItem value="reviewing">قيد المراجعة</SelectItem>
            <SelectItem value="closed">مغلقة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && <Skeleton className="h-40 w-full rounded-xl" />}
      {error && (
        <p className="text-sm text-destructive">{error instanceof Error ? error.message : 'خطأ'}</p>
      )}

      <div className="space-y-4">
        {(data?.complaints ?? []).map((item) => (
          <Card key={item.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                {item.customer?.full_name ?? 'عميل'} → {item.technician?.full_name ?? 'مقاول'}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {format(new Date(item.created_at), 'yyyy-MM-dd HH:mm')} — حالة الحجز:{' '}
                {item.booking?.status ?? '—'}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm whitespace-pre-wrap">{item.body}</p>
              <div className="flex flex-wrap gap-2">
                {(['open', 'reviewing', 'closed'] as ComplaintStatus[]).map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={item.status === status ? 'default' : 'outline'}
                    disabled={updateMutation.isPending}
                    onClick={() => updateMutation.mutate({ id: item.id, status })}
                  >
                    {status === 'open' ? 'مفتوحة' : status === 'reviewing' ? 'مراجعة' : 'مغلقة'}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {!isLoading && (data?.complaints.length ?? 0) === 0 && (
          <p className="text-center text-sm text-muted-foreground">لا توجد شكاوى.</p>
        )}
      </div>
    </div>
  );
}

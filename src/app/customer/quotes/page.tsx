'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { QUOTE_STATUS_LABELS_AR } from '@/lib/validations/quote-requests';
import { toast } from '@/hooks/use-toast';

interface QuoteRow {
  id: string;
  status: keyof typeof QUOTE_STATUS_LABELS_AR;
  project_description: string;
  address: string;
  quoted_amount: number | string | null;
  booking_id: string | null;
  contractor: { full_name: string | null } | { full_name: string | null }[] | null;
}

function contractorName(quote: QuoteRow) {
  const profile = Array.isArray(quote.contractor) ? quote.contractor[0] : quote.contractor;
  return profile?.full_name ?? 'مقاول';
}

async function fetchQuotes(): Promise<QuoteRow[]> {
  const res = await fetch('/api/quote-requests');
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? 'تعذّر تحميل العروض');
  return body.quotes ?? [];
}

export default function CustomerQuotesPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['customer-quotes'],
    queryFn: fetchQuotes,
  });
  const [pendingId, setPendingId] = useState<string | null>(null);

  const act = async (id: string, action: 'accept' | 'decline') => {
    setPendingId(id);
    try {
      const res = await fetch(`/api/quote-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast({
          title: 'تعذّر تحديث العرض',
          description: typeof body.error === 'string' ? body.error : 'حاول مرة أخرى',
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: action === 'accept' ? 'تم قبول العرض وإنشاء حجز قيد الانتظار' : 'تم رفض العرض',
      });
      await queryClient.invalidateQueries({ queryKey: ['customer-quotes'] });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="container max-w-3xl py-8" dir="rtl">
      <h1 className="text-2xl font-bold">عروض الأسعار</h1>
      <p className="mt-1 text-sm text-muted-foreground">طلباتك للمقاولين وحالة كل عرض.</p>
      {isLoading && <p className="mt-6 text-sm">جارٍ التحميل…</p>}
      {error && <p className="mt-6 text-sm text-destructive">{error.message}</p>}
      <div className="mt-6 space-y-4">
        {(data ?? []).map((quote) => (
          <article key={quote.id} className="rounded-2xl border p-4" data-quote-status={quote.status}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">{contractorName(quote)}</h2>
              <span className="text-sm text-muted-foreground">{QUOTE_STATUS_LABELS_AR[quote.status]}</span>
            </div>
            <p className="mt-2 text-sm">{quote.project_description}</p>
            <p className="mt-1 text-xs text-muted-foreground">{quote.address}</p>
            {quote.quoted_amount != null && (
              <p className="mt-2 text-sm font-semibold">المبلغ: {quote.quoted_amount} ج.م</p>
            )}
            {quote.status === 'quoted' && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" disabled={pendingId === quote.id} onClick={() => void act(quote.id, 'accept')}>
                  قبول العرض
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pendingId === quote.id}
                  onClick={() => void act(quote.id, 'decline')}
                >
                  رفض
                </Button>
              </div>
            )}
            {quote.booking_id && (
              <Button asChild size="sm" variant="link" className="mt-2 px-0">
                <Link href={`/customer/bookings/${quote.booking_id}`}>فتح الحجز</Link>
              </Button>
            )}
          </article>
        ))}
        {!isLoading && (data?.length ?? 0) === 0 && (
          <p className="text-sm text-muted-foreground">لا توجد طلبات بعد.</p>
        )}
      </div>
    </div>
  );
}

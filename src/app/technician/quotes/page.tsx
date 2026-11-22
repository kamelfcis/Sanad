'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QUOTE_STATUS_LABELS_AR } from '@/lib/validations/quote-requests';
import { toast } from '@/hooks/use-toast';

interface QuoteRow {
  id: string;
  status: keyof typeof QUOTE_STATUS_LABELS_AR;
  project_description: string;
  address: string;
  quoted_amount: number | string | null;
  customer: { full_name: string | null } | { full_name: string | null }[] | null;
}

function customerName(quote: QuoteRow) {
  const profile = Array.isArray(quote.customer) ? quote.customer[0] : quote.customer;
  return profile?.full_name ?? 'عميل';
}

async function fetchQuotes(): Promise<QuoteRow[]> {
  const res = await fetch('/api/quote-requests');
  const body = await res.json();
  if (!res.ok) throw new Error(typeof body.error === 'string' ? body.error : 'تعذّر تحميل العروض');
  return body.quotes ?? [];
}

export default function TechnicianQuotesPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['technician-quotes'],
    queryFn: fetchQuotes,
  });
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);

  const sendQuote = async (id: string) => {
    const amount = Number(amounts[id]);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ title: 'أدخل مبلغًا صحيحًا', variant: 'destructive' });
      return;
    }
    setPendingId(id);
    try {
      const res = await fetch(`/api/quote-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'quote', quoted_amount: amount }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast({
          title: 'تعذّر إرسال العرض',
          description: typeof body.error === 'string' ? body.error : 'حاول مرة أخرى',
          variant: 'destructive',
        });
        return;
      }
      toast({ title: 'تم إرسال عرض السعر' });
      await queryClient.invalidateQueries({ queryKey: ['technician-quotes'] });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="container max-w-3xl py-8" dir="rtl">
      <h1 className="text-2xl font-bold">طلبات عروض الأسعار</h1>
      <p className="mt-1 text-sm text-muted-foreground">حدّد المبلغ للطلبات الجديدة.</p>
      {isLoading && <p className="mt-6 text-sm">جارٍ التحميل…</p>}
      {error && <p className="mt-6 text-sm text-destructive">{error.message}</p>}
      <div className="mt-6 space-y-4">
        {(data ?? []).map((quote) => (
          <article key={quote.id} className="rounded-2xl border p-4" data-quote-status={quote.status}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">{customerName(quote)}</h2>
              <span className="text-sm text-muted-foreground">{QUOTE_STATUS_LABELS_AR[quote.status]}</span>
            </div>
            <p className="mt-2 text-sm">{quote.project_description}</p>
            <p className="mt-1 text-xs text-muted-foreground">{quote.address}</p>
            {quote.status === 'submitted' ? (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Input
                  type="number"
                  min={1}
                  inputMode="decimal"
                  aria-label="مبلغ العرض"
                  placeholder="مبلغ العرض"
                  value={amounts[quote.id] ?? ''}
                  onChange={(event) =>
                    setAmounts((current) => ({ ...current, [quote.id]: event.target.value }))
                  }
                />
                <Button disabled={pendingId === quote.id} onClick={() => void sendQuote(quote.id)}>
                  إرسال العرض
                </Button>
              </div>
            ) : (
              quote.quoted_amount != null && (
                <p className="mt-2 text-sm font-semibold">المبلغ: {quote.quoted_amount} ج.م</p>
              )
            )}
          </article>
        ))}
        {!isLoading && (data?.length ?? 0) === 0 && (
          <p className="text-sm text-muted-foreground">لا توجد طلبات.</p>
        )}
      </div>
    </div>
  );
}

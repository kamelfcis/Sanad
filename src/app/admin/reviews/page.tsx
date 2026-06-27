'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react';
import { useAdminReviews, useAdminModerateReview } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminPagination } from '@/components/admin/admin-pagination';
import { Star, Eye, EyeOff } from 'lucide-react';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { translateAdminError } from '@/lib/i18n/admin/translate-error';
import { cn } from '@/lib/utils/cn';

export default function AdminReviewsPage() {
  const { t, formatDateTime, dir } = useAdminT();
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [note, setNote] = useState('');
  const [activeModeration, setActiveModeration] = useState<string | null>(null);
  const iconMargin = dir === 'ltr' ? 'mr-1' : 'ml-1';

  const { data, isLoading, error } = useAdminReviews(filter, page);
  const moderate = useAdminModerateReview();

  const handleModerate = (reviewId: string, action: 'hide' | 'restore') => {
    moderate.mutate({ reviewId, action, note: note || undefined }, {
      onSuccess: () => { setActiveModeration(null); setNote(''); },
    });
  };

  const filters = [
    { label: t('reviews.filters.all'), value: undefined },
    { label: t('reviews.filters.visible'), value: 'false' },
    { label: t('reviews.filters.hidden'), value: 'true' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{t('reviews.title')}</h1>
        <p className="mt-1 text-muted-foreground">{t('reviews.subtitle')}</p>
      </div>

      <div className="mb-6 flex gap-2">
        {filters.map((f) => (
          <button
            key={String(f.value)}
            onClick={() => { setFilter(f.value); setPage(1); }}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-muted-foreground/50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          {translateAdminError(error.message, t)}
        </div>
      ) : !data?.reviews.length ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Star className="h-12 w-12 text-muted-foreground/50" />
          <h2 className="text-lg font-semibold">{t('reviews.empty')}</h2>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {data.reviews.map((r: any) => (
              <Card key={r.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{r.customer?.full_name ?? t('technicians.detail.anonymous')}</span>
                        <span className="text-yellow-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                        {r.is_hidden && <Badge variant="outline" className="bg-gray-100 text-gray-600">{t('reviews.hidden')}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('reviews.forTechnician', { name: r.technician?.full_name ?? t('common.unknown') })}
                      </p>
                      {r.comment && <p className="mt-2 text-sm" dir="auto">{r.comment}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(r.created_at)}</p>
                    </div>
                    <div className="shrink-0">
                      {activeModeration === r.id ? (
                        <div className="space-y-2">
                          <div>
                            <Label htmlFor="note" className="text-xs">{t('reviews.noteOptional')}</Label>
                            <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('reviews.notePlaceholder')} className="h-8 w-40 text-xs" />
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => handleModerate(r.id, r.is_hidden ? 'restore' : 'hide')} disabled={moderate.isPending}>
                              {r.is_hidden ? t('reviews.restore') : t('reviews.hide')}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setActiveModeration(null); setNote(''); }}>{t('common.cancel')}</Button>
                          </div>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setActiveModeration(r.id)}>
                          {r.is_hidden ? <Eye className={cn('h-4 w-4', iconMargin)} /> : <EyeOff className={cn('h-4 w-4', iconMargin)} />}
                          {t('reviews.moderate')}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <AdminPagination
            page={page}
            totalPages={Math.ceil(data.total / data.limit)}
            total={data.total}
            onPageChange={setPage}
            summaryClassName="text-muted-foreground"
          />
        </>
      )}
    </div>
  );
}

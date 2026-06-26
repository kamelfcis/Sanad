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
import { Star, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminReviewsPage() {
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [note, setNote] = useState('');
  const [activeModeration, setActiveModeration] = useState<string | null>(null);

  const { data, isLoading, error } = useAdminReviews(filter, page);
  const moderate = useAdminModerateReview();

  const handleModerate = (reviewId: string, action: 'hide' | 'restore') => {
    moderate.mutate({ reviewId, action, note: note || undefined }, {
      onSuccess: () => { setActiveModeration(null); setNote(''); },
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Review Moderation</h1>
        <p className="mt-1 text-muted-foreground">Review and moderate customer reviews.</p>
      </div>

      <div className="mb-6 flex gap-2">
        {[
          { label: 'All', value: undefined },
          { label: 'Visible', value: 'false' },
          { label: 'Hidden', value: 'true' },
        ].map((f) => (
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
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">Failed to load reviews.</div>
      ) : !data?.reviews.length ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Star className="h-12 w-12 text-muted-foreground/50" />
          <h2 className="text-lg font-semibold">No reviews found</h2>
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
                        <span className="font-medium">{r.customer?.full_name ?? 'Anonymous'}</span>
                        <span className="text-yellow-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                        {r.is_hidden && <Badge variant="outline" className="bg-gray-100 text-gray-600">Hidden</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">For: {r.technician?.full_name ?? 'Unknown'}</p>
                      {r.comment && <p className="mt-2 text-sm" dir="auto">{r.comment}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">{format(new Date(r.created_at), 'MMM d, yyyy \'at\' h:mm a')}</p>
                    </div>
                    <div className="shrink-0">
                      {activeModeration === r.id ? (
                        <div className="space-y-2">
                          <div>
                            <Label htmlFor="note" className="text-xs">Note (optional)</Label>
                            <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason..." className="h-8 w-40 text-xs" />
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => handleModerate(r.id, r.is_hidden ? 'restore' : 'hide')} disabled={moderate.isPending}>
                              {r.is_hidden ? 'Restore' : 'Hide'}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setActiveModeration(null); setNote(''); }}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setActiveModeration(r.id)}>
                          {r.is_hidden ? <Eye className="mr-1 h-4 w-4" /> : <EyeOff className="mr-1 h-4 w-4" />}
                          Moderate
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Page {data.page} of {Math.ceil(data.total / data.limit)} ({data.total} total)</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /> Previous</Button>
              <Button variant="outline" size="sm" disabled={page * data.limit >= data.total} onClick={() => setPage(page + 1)}>Next <ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

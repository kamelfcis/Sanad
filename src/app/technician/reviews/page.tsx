'use client';

import Link from 'next/link';
import { Star, ArrowRight } from 'lucide-react';
import { useTechnicianProfile } from '@/hooks/use-technician';
import { useTechnicianReviews } from '@/hooks/use-reviews';
import { RatingSummary } from '@/components/shared/rating-summary';
import { ReviewCard } from '@/components/shared/review-card';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function TechnicianReviewsPage() {
  const { data: techProfile } = useTechnicianProfile();
  const { data: reviews, isLoading, isError } = useTechnicianReviews(techProfile?.id ?? '');

  const distribution = (() => {
    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews?.forEach((r) => {
      dist[r.rating] = (dist[r.rating] ?? 0) + 1;
    });
    return dist;
  })();

  return (
    <div className="container py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">التقييمات</h1>
          <p className="mt-1 text-muted-foreground">
            تقييمات العملاء التي حصلت عليها بعد إتمام الخدمات.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/technician/jobs">
            <ArrowRight className="ml-1 h-4 w-4" />
            العودة إلى الطلبات
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <RatingSummary
                averageRating={techProfile?.average_rating ?? 0}
                totalRatings={techProfile?.total_ratings ?? 0}
                distribution={distribution}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3 lg:col-span-2">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : isError ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-sm text-destructive">
                تعذّر تحميل التقييمات. يرجى تحديث الصفحة.
              </CardContent>
            </Card>
          ) : !reviews || reviews.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <Star className="h-8 w-8 text-muted-foreground/30" />
                <div>
                  <p className="text-sm font-medium">لا توجد تقييمات بعد</p>
                  <p className="text-xs text-muted-foreground">
                    ستظهر التقييمات هنا بعد أن يُكمل العملاء طلباتهم ويقيّموا خدمتك.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            reviews.map((review) => (
              <ReviewCard
                key={review.id}
                rating={review.rating}
                comment={review.comment}
                createdAt={review.created_at}
                customerName={review.customer?.full_name ?? null}
                customerAvatar={review.customer?.avatar_url ?? null}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

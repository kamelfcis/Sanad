'use client';

import { Star } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useTechnicianReviews } from '@/hooks/use-reviews';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { PageLoading } from '@/components/shared/page-loading';
import { StarRating } from '@/components/shared/star-rating';

export default function TechnicianReviewsPage() {
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const { data, isLoading, error, refetch } = useTechnicianReviews(userId);

  return (
    <div className="container py-8" dir="rtl">
      <h1 className="text-3xl font-bold tracking-tight">التقييمات</h1>
      <p className="mt-1 text-muted-foreground">آراء العملاء بعد إنجاز الطلبات.</p>

      {isLoading ? (
        <PageLoading />
      ) : error ? (
        <ErrorState
          title="تعذّر تحميل التقييمات"
          description="حدث خطأ أثناء جلب تقييماتك."
          onRetry={() => void refetch()}
        />
      ) : !data?.length ? (
        <EmptyState icon={Star} title="لا توجد تقييمات بعد" description="ستظهر التقييمات هنا بعد إكمال الطلبات." />
      ) : (
        <ul className="mt-6 space-y-3">
          {data.map((review) => (
            <li key={review.id} className="rounded-xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{review.customer?.full_name ?? 'عميل'}</p>
                <StarRating rating={review.rating} disabled />
              </div>
              {review.comment ? (
                <p className="mt-2 text-sm text-muted-foreground break-words">{review.comment}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

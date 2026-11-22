'use client';

import { Star } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useTechnicianProfile } from '@/hooks/use-technician';
import { useTechnicianReviews } from '@/hooks/use-reviews';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { PageLoading } from '@/components/shared/page-loading';
import { StarRating } from '@/components/shared/star-rating';

function customerFirstName(fullName: string | null | undefined): string | null {
  const trimmed = fullName?.trim();
  if (!trimmed) return null;
  const first = trimmed.split(/\s+/)[0];
  return first || null;
}

export default function TechnicianReviewsPage() {
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const { data: profile } = useTechnicianProfile();
  const { data, isLoading, error, refetch } = useTechnicianReviews(userId);

  return (
    <div className="container py-8" dir="rtl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">التقييمات</h1>
          <p className="mt-1 text-muted-foreground">آراء العملاء بعد إنجاز الطلبات.</p>
        </div>
        {(profile?.total_ratings ?? data?.length ?? 0) > 0 && (
          <p className="text-sm text-muted-foreground">
            المتوسط{' '}
            <span className="font-semibold text-foreground">
              {Number(
                profile && profile.total_ratings > 0
                  ? profile.average_rating
                  : (data ?? []).reduce((sum, review) => sum + Number(review.rating), 0) /
                    Math.max(data?.length ?? 1, 1),
              ).toFixed(1)}
            </span>{' '}
            · {Math.max(profile?.total_ratings ?? 0, data?.length ?? 0)} تقييم
          </p>
        )}
      </div>

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
                <p className="font-medium">
                  {customerFirstName(review.customer?.full_name) ?? 'بدون اسم'}
                </p>
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

'use client';

import Link from 'next/link';
import { useTechnicianProfile } from '@/hooks/use-technician';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageLoading } from '@/components/shared/page-loading';
import { ErrorState } from '@/components/shared/error-state';

export default function TechnicianProfilePage() {
  const { data, isLoading, error, refetch } = useTechnicianProfile();

  return (
    <div className="container py-8" dir="rtl">
      <h1 className="text-3xl font-bold tracking-tight">الملف الشخصي</h1>
      <p className="mt-1 text-muted-foreground">بياناتك الظاهرة للعملاء والإدارة.</p>

      {isLoading ? (
        <PageLoading />
      ) : error ? (
        <ErrorState
          title="تعذّر تحميل الملف"
          description="حدث خطأ أثناء جلب بيانات الفني."
          onRetry={() => void refetch()}
        />
      ) : (
        <Card className="mt-6 max-w-xl">
          <CardContent className="space-y-3 p-6 text-sm">
            <p>
              <span className="text-muted-foreground">المحافظة: </span>
              {data?.governorate ?? '—'}
            </p>
            <p>
              <span className="text-muted-foreground">سنوات الخبرة: </span>
              {data?.years_experience ?? '—'}
            </p>
            <p className="break-words">
              <span className="text-muted-foreground">نبذة: </span>
              {data?.bio ?? '—'}
            </p>
            <p>
              <span className="text-muted-foreground">حالة التوثيق: </span>
              {data?.verification_status ?? '—'}
            </p>
            <Button asChild>
              <Link href="/auth/register-technician?complete=1">تحديث البيانات</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

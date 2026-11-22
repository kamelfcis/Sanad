'use client';

import Link from 'next/link';
import { Briefcase, MapPin, Star, Wrench, FileText, ArrowLeft } from 'lucide-react';
import { useTechnicianProfile, useTechnicianSkills } from '@/hooks/use-technician';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoading } from '@/components/shared/page-loading';
import { ErrorState } from '@/components/shared/error-state';
import { AvailabilityCard } from '@/components/technician/availability-card';
import { VerificationStatusBadge } from '@/components/technician/verification-status-badge';
import { useFormatMoney } from '@/hooks/use-site-settings';

export default function TechnicianProfilePage() {
  const { data, isLoading, error, refetch } = useTechnicianProfile();
  const { data: skills, isLoading: skillsLoading } = useTechnicianSkills();
  const { formatMoney } = useFormatMoney();

  return (
    <div className="container max-w-3xl py-8" dir="rtl">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الملف الشخصي</h1>
          <p className="mt-1 text-muted-foreground">بياناتك الظاهرة للعملاء ولوحة الإدارة.</p>
        </div>
        {data?.verification_status ? (
          <VerificationStatusBadge status={data.verification_status} />
        ) : null}
      </div>

      {isLoading ? (
        <PageLoading />
      ) : error ? (
        <ErrorState
          title="تعذّر تحميل الملف"
          description="حدث خطأ أثناء جلب بيانات الفني."
          onRetry={() => void refetch()}
        />
      ) : data ? (
        <div className="space-y-6">
          <AvailabilityCard
            isAvailable={Boolean(data.is_available)}
            verificationStatus={data.verification_status}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>الطلبات المكتملة</CardDescription>
                <CardTitle className="flex items-center gap-2 text-3xl tabular-nums">
                  <Briefcase className="h-6 w-6 text-primary" aria-hidden />
                  {data.completed_jobs ?? 0}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>متوسط التقييم</CardDescription>
                <CardTitle className="flex items-center gap-2 text-3xl tabular-nums">
                  <Star className="h-6 w-6 text-amber-500" aria-hidden />
                  {(data.average_rating ?? 0).toFixed(1)}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({data.total_ratings ?? 0} تقييم)
                  </span>
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" aria-hidden />
                نبذة عنك
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <span>
                  <span className="text-muted-foreground">المحافظة: </span>
                  {data.governorate ?? '—'}
                </span>
              </p>
              {data.years_experience != null ? (
                <p>
                  <span className="text-muted-foreground">سنوات الخبرة: </span>
                  {data.years_experience}
                </p>
              ) : null}
              <p className="leading-relaxed text-foreground/90">{data.bio?.trim() || 'لم تُضف نبذة بعد.'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wrench className="h-5 w-5 text-primary" aria-hidden />
                الخدمات والمهارات
              </CardTitle>
              <CardDescription>الخدمات النشطة التي تقدّمها للعملاء.</CardDescription>
            </CardHeader>
            <CardContent>
              {skillsLoading ? (
                <p className="text-sm text-muted-foreground">جاري التحميل…</p>
              ) : !skills?.length ? (
                <p className="text-sm text-muted-foreground">لم تُضف مهارات بعد. أكمل التسجيل لإضافتها.</p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {skills.map((skill) => {
                    const price =
                      skill.price_override ?? skill.services?.price ?? null;
                    const priceLabel =
                      skill.services?.price_type === 'quote' || price == null
                        ? 'حسب المعاينة'
                        : formatMoney(price);
                    return (
                      <li
                        key={skill.id}
                        className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                      >
                        <span className="font-medium">{skill.services?.name_ar ?? 'خدمة'}</span>
                        <span className="text-muted-foreground">{priceLabel}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild size="lg" className="sm:flex-1">
              <Link href="/auth/register-technician?complete=1">تحديث البيانات والوثائق</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="sm:flex-1">
              <Link href="/technician/jobs">
                <ArrowLeft className="ms-2 h-4 w-4" aria-hidden />
                طلبات العمل
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

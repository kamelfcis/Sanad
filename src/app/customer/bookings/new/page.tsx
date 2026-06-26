'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BookingForm } from '@/components/shared/booking-form';
import { SelectedTechnicianBanner } from '@/components/booking/selected-technician-banner';
import { PageLoading } from '@/components/shared/page-loading';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function NewBookingContent() {
  const searchParams = useSearchParams();
  const defaultServiceId = searchParams.get('service_id') ?? undefined;
  const defaultTechnicianId = searchParams.get('technician_id') ?? undefined;

  return (
    <div className="container py-8" dir="rtl">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href={defaultTechnicianId ? '/services' : '/customer/bookings'}>
          <ArrowRight className="ml-1 h-4 w-4" />
          {defaultTechnicianId ? 'العودة إلى الصنايعية' : 'العودة إلى الحجوزات'}
        </Link>
      </Button>

      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">حجز خدمة جديدة</h1>
          <p className="mt-1 text-muted-foreground">
            {defaultTechnicianId
              ? 'أكمل تفاصيل الطلب لإرساله للصنايعي الذي اخترته.'
              : 'أخبرنا بما تحتاج وسنطابقك مع صنايعي مؤهل.'}
          </p>
        </div>

        {defaultTechnicianId && (
          <div className="mb-6">
            <SelectedTechnicianBanner technicianId={defaultTechnicianId} />
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">تفاصيل الخدمة</CardTitle>
            <CardDescription>
              املأ البيانات الخاصة بالخدمة المطلوبة.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BookingForm
              defaultServiceId={defaultServiceId}
              defaultTechnicianId={defaultTechnicianId}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function NewBookingPage() {
  return (
    <Suspense fallback={<PageLoading className="py-16" />}>
      <NewBookingContent />
    </Suspense>
  );
}

'use client';

import Link from 'next/link';
import { Building2, Clock3, Hammer, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SlideUpView } from '@/components/animations';
import { colors } from '@/lib/design-system';

export function LandingServicePaths() {
  return (
    <section className="bg-surface px-4 py-16 md:px-6 md:py-20 lg:px-8" dir="rtl">
      <div className="mx-auto max-w-6xl">
        <SlideUpView className="mb-10 text-center">
          <h2
            className="text-pretty text-3xl font-bold text-text-primary md:text-4xl"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            فني لمهمة. مقاول لمشروع.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-text-secondary">
            نفس المنصة، مساران واضحان حسب حجم الشغل.
          </p>
        </SlideUpView>

        <div className="grid gap-4 md:grid-cols-2 md:gap-6">
          <article className="flex flex-col rounded-2xl border border-border bg-white p-6 shadow-sm dark:bg-card md:p-8">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: `${colors.primary}18`, color: colors.primary }}
            >
              <Hammer className="h-6 w-6" aria-hidden />
            </span>
            <h3 className="mt-4 text-2xl font-bold text-text-primary" style={{ fontFamily: 'var(--font-heading)' }}>
              فني
            </h3>
            <p className="mt-2 text-sm text-text-secondary">حجز مباشر لحرفة واحدة ووقت زيارة محدد.</p>
            <ul className="mt-5 space-y-2 text-sm text-text-primary">
              <li>حجز مباشر</li>
              <li>تخصص واحد</li>
              <li>وقت الزيارة</li>
            </ul>
            <Button asChild className="mt-6 h-11 rounded-xl bg-gradient-to-br from-primary to-accent text-white">
              <Link href="/services?providerRole=technician">احجز فني</Link>
            </Button>
          </article>

          <article className="flex flex-col rounded-2xl border border-border bg-white p-6 shadow-sm dark:bg-card md:p-8">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: `${colors.secondary}18`, color: colors.secondary }}
            >
              <Building2 className="h-6 w-6" aria-hidden />
            </span>
            <h3 className="mt-4 text-2xl font-bold text-text-primary" style={{ fontFamily: 'var(--font-heading)' }}>
              مقاول
            </h3>
            <p className="mt-2 text-sm text-text-secondary">طلب عرض سعر حسب نوع المقاول وسعة الفريق.</p>
            <ul className="mt-5 space-y-2 text-sm text-text-primary">
              <li className="flex items-center gap-2">
                <Users className="h-4 w-4 text-secondary" aria-hidden />
                متخصص أو متكامل
              </li>
              <li className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-secondary" aria-hidden />
                سعة العمل الحالية
              </li>
              <li>حجم الفريق</li>
              <li>طلب عرض سعر</li>
            </ul>
            <Button asChild variant="secondary" className="mt-6 h-11 rounded-xl">
              <Link href="/services?providerRole=contractor">اطلب مقاول</Link>
            </Button>
          </article>
        </div>
      </div>
    </section>
  );
}

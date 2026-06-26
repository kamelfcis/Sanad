'use client';

import Link from 'next/link';
import { colors, gradients } from '@/lib/design-system';
import { SUBSCRIPTION_BENEFITS, TRUST_BULLETS } from '@/lib/constants/technician-registration';
import { Check } from 'lucide-react';

export function TechnicianRegisterLayout({
  children,
  showLoginLink = true,
}: {
  children: React.ReactNode;
  showLoginLink?: boolean;
}) {
  return (
    <div dir="rtl" className="min-h-screen bg-surface" style={{ fontFamily: 'var(--font-cairo)' }}>
      <header className="border-b border-border bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: gradients.primary }}
            >
              <span className="text-base font-bold text-white">س</span>
            </div>
            <span className="text-lg font-bold text-text-primary">سند</span>
          </Link>
          {showLoginLink ? (
            <Link href="/auth/login" className="text-sm font-medium text-primary hover:underline">
              لديك حساب؟ تسجيل الدخول
            </Link>
          ) : (
            <span className="text-sm text-text-secondary">أكمل بياناتك كفني</span>
          )}
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1fr_320px] lg:gap-10">
        <main>{children}</main>

        <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="px-6 py-5" style={{ background: gradients.primary }}>
              <p className="text-sm text-white/80">الباقة الأساسية</p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">10</span>
                <span className="text-sm text-white/90">ج.م / شهر</span>
              </div>
            </div>
            <div className="space-y-3 px-6 py-5">
              {SUBSCRIPTION_BENEFITS.map((benefit) => (
                <div key={benefit} className="flex items-start gap-2 text-sm text-text-secondary">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{benefit}</span>
                </div>
              ))}
              <button
                type="button"
                className="mt-2 w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: gradients.primary }}
              >
                اشترك دلوقتي
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-bold text-text-primary">ليه صنايعي؟</h3>
            <ul className="space-y-3">
              {TRUST_BULLETS.map((item) => (
                <li key={item.text} className="flex items-start gap-2 text-sm text-text-secondary">
                  <span className="text-base leading-none">{item.icon}</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function TechnicianRegisterHero({ completeMode = false }: { completeMode?: boolean }) {
  return (
    <div className="mb-8">
      <span
        className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-medium"
        style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}
      >
        {completeMode ? 'خطوة أخيرة' : 'خطوة واحدة بس'}
      </span>
      <h1
        className="text-2xl font-bold text-text-primary md:text-3xl"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        {completeMode ? 'أكمل بياناتك كصنايعي' : 'سجّل بياناتك وابدأ تستقبل طلبات'}
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        {completeMode
          ? 'املأ باقي البيانات عشان نراجع طلبك وتوصلك الشغل.'
          : 'ملف احترافي = طلبات أكتر. املأ البيانات بدقة.'}
      </p>
    </div>
  );
}

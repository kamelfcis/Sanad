'use client';

import { colors, gradients } from '@/lib/design-system';
import {
  CONTRACTOR_TRUST_BULLETS,
  SUBSCRIPTION_BENEFITS,
  TRUST_BULLETS,
} from '@/lib/constants/technician-registration';
import { RegisterTopBar } from '@/components/auth/register-role-chrome';
import { SubscriptionExplainerVideo } from '@/components/auth/subscription-explainer-video';
import { Check } from 'lucide-react';

export function TechnicianRegisterLayout({
  children,
  showLoginLink = true,
  audience = 'technician',
}: {
  children: React.ReactNode;
  showLoginLink?: boolean;
  audience?: 'technician' | 'contractor';
}) {
  const isContractor = audience === 'contractor';
  const trustBullets = isContractor ? CONTRACTOR_TRUST_BULLETS : TRUST_BULLETS;

  return (
    <div dir="rtl" className="min-h-screen bg-surface" style={{ fontFamily: 'var(--font-cairo)' }}>
      <RegisterTopBar
        showRoleSwitch={showLoginLink}
        showLoginLink={showLoginLink}
        statusLabel={
          showLoginLink ? undefined : isContractor ? 'أكمل بياناتك كمقاول' : 'أكمل بياناتك كفني'
        }
      />

      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1fr_320px] lg:gap-10">
        <main>{children}</main>

        <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
          <SubscriptionExplainerVideo />
          <div className="overflow-hidden rounded-2xl border border-border bg-white dark:bg-card shadow-sm">
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
                className="mt-2 w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
                style={{ background: gradients.primary }}
              >
                اشترك دلوقتي
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white dark:bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-base font-bold text-text-primary">
              {isContractor ? 'ليه مقاول؟' : 'ليه صنايعي؟'}
            </h3>
            <ul className="space-y-3">
              {trustBullets.map((item) => (
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

export function TechnicianRegisterHero({
  completeMode = false,
  audience = 'technician',
}: {
  completeMode?: boolean;
  audience?: 'technician' | 'contractor';
}) {
  const isContractor = audience === 'contractor';
  const title = completeMode
    ? isContractor
      ? 'أكمل بياناتك كمقاول'
      : 'أكمل بياناتك كصنايعي'
    : isContractor
      ? 'سجّل كمقاول وابدأ ترسل عروض أسعار'
      : 'سجّل بياناتك وابدأ تستقبل طلبات';
  const subtitle = completeMode
    ? isContractor
      ? 'املأ باقي البيانات عشان نراجع طلبك وتوصلك المشاريع.'
      : 'املأ باقي البيانات عشان نراجع طلبك وتوصلك الشغل.'
    : isContractor
      ? 'عرض سعر وسعة فريق، مش حجز زيارة واحدة.'
      : 'ملف احترافي = طلبات أكتر. املأ البيانات بدقة.';

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
        {title}
      </h1>
      <p className="mt-2 text-sm text-text-secondary">{subtitle}</p>
    </div>
  );
}

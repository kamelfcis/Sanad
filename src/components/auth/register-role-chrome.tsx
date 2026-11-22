'use client';

import Link from 'next/link';
import { Building2, UserCheck, Wrench } from 'lucide-react';
import { gradients } from '@/lib/design-system';
import { cn } from '@/lib/utils/cn';

export type RegisterAudience = 'customer' | 'technician' | 'contractor';

const PATH_COPY: Record<RegisterAudience, { label: string; hint: string; tone: string }> = {
  customer: {
    label: 'عميل',
    hint: 'حجز مباشر من فني معتمد.',
    tone: 'border-primary/30 bg-primary/10 text-primary',
  },
  technician: {
    label: 'فني',
    hint: 'تستقبل حجزًا مباشرًا على تخصصك.',
    tone: 'border-secondary/30 bg-secondary/10 text-secondary',
  },
  contractor: {
    label: 'مقاول',
    hint: 'ترسل عرض سعر حسب نوعك وسعة فريقك.',
    tone: 'border-[#9A3412]/30 bg-[#9A3412]/10 text-[#9A3412] dark:text-[#FDBA74]',
  },
};

const ROLE_CARDS: Array<{
  audience: RegisterAudience;
  title: string;
  benefit: string;
  href: string;
  icon: typeof UserCheck;
  iconBg: string;
  hover: string;
  ring: string;
}> = [
  {
    audience: 'customer',
    title: 'عميل',
    benefit: 'أحتاج خدمات منزلية — احجز فنيًا معتمدًا مباشرة',
    href: '/auth/register?role=customer',
    icon: UserCheck,
    iconBg: 'bg-gradient-to-br from-primary to-accent',
    hover: 'hover:border-primary hover:shadow-md',
    ring: 'focus-visible:ring-primary',
  },
  {
    audience: 'technician',
    title: 'فني',
    benefit: 'أقدم خدمات منزلية — استقبل حجوزات مباشرة',
    href: '/auth/register-technician',
    icon: Wrench,
    iconBg: 'bg-gradient-to-br from-secondary to-[#2F7084]',
    hover: 'hover:border-secondary hover:shadow-md',
    ring: 'focus-visible:ring-secondary',
  },
  {
    audience: 'contractor',
    title: 'مقاول',
    benefit: 'شركة أو شخص يتولى المشروع كاملًا ويرسل عروض أسعار',
    href: '/auth/register-technician?as=contractor',
    icon: Building2,
    iconBg: 'bg-gradient-to-br from-[#9A3412] to-primary',
    hover: 'hover:border-[#9A3412] hover:shadow-md',
    ring: 'focus-visible:ring-[#9A3412]',
  },
];

export function RegisterTopBar({
  showRoleSwitch = true,
  showLoginLink = true,
  statusLabel,
}: {
  showRoleSwitch?: boolean;
  showLoginLink?: boolean;
  statusLabel?: string;
}) {
  return (
    <header className="border-b border-border bg-white px-4 py-4 dark:bg-card sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ background: gradients.primary }}
          >
            <span className="text-base font-bold text-white">س</span>
          </div>
          <span className="text-lg font-bold text-text-primary">سند</span>
        </Link>
        <nav aria-label="تنقل التسجيل" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {statusLabel ? (
            <span className="font-medium text-text-secondary">{statusLabel}</span>
          ) : null}
          {showRoleSwitch ? (
            <Link
              href="/auth/register"
              className="rounded-sm font-medium text-text-primary underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              تغيير نوع الحساب
            </Link>
          ) : null}
          {showLoginLink ? (
            <Link
              href="/auth/login"
              className="rounded-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              لديك حساب؟ دخول
            </Link>
          ) : null}
          <Link
            href="/"
            className="rounded-sm font-medium text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            الرئيسية
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function RegisterPathBadge({
  audience,
  className,
}: {
  audience: RegisterAudience;
  className?: string;
}) {
  const copy = PATH_COPY[audience];
  return (
    <div className={cn('space-y-1.5', className)}>
      <p
        id="registration-path-badge"
        className={cn(
          'inline-flex w-fit items-center rounded-full border px-3 py-1 text-sm font-semibold',
          copy.tone,
        )}
      >
        {copy.label}
      </p>
      <p className="text-sm text-text-secondary">{copy.hint}</p>
    </div>
  );
}

export function RegisterRoleChooser() {
  return (
    <div dir="rtl" className="min-h-screen bg-background" style={{ fontFamily: 'var(--font-cairo)' }}>
      <RegisterTopBar />
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-8 text-center">
          <h1
            className="text-3xl font-bold text-text-primary"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            إنشاء حساب
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-text-secondary sm:text-base">
            الحجز المباشر للعميل والفني. المقاول يرسل عرض سعر حسب سعة الفريق.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {ROLE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.audience}
                href={card.href}
                className={cn(
                  'group flex h-full flex-col items-start gap-4 rounded-2xl border-2 border-border bg-card p-6 text-right shadow-sm transition-all hover:-translate-y-0.5',
                  card.hover,
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                  card.ring,
                )}
              >
                <div className={cn('flex h-14 w-14 items-center justify-center rounded-2xl', card.iconBg)}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <div className="space-y-1">
                  <h2
                    className="text-xl font-semibold text-text-primary"
                    style={{ fontFamily: 'var(--font-cairo)' }}
                  >
                    {card.title}
                  </h2>
                  <p className="text-sm leading-6 text-text-secondary">{card.benefit}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}

'use client';

import { BadgeCheck, Lock, ShieldCheck, Award } from 'lucide-react';
import { SlideUpView } from '@/components/animations';

const badges = [
  { icon: BadgeCheck, label: 'فنيون موثّقون', sub: 'تحقق من الهوية والمهارات' },
  { icon: ShieldCheck, label: 'ضمان الرضا', sub: 'استرداد إذا لم تكن راضياً' },
  { icon: Lock, label: 'دفع آمن', sub: 'تشفير SSL 256-bit' },
  { icon: Award, label: 'معتمد رسمياً', sub: 'متوافق مع معايير الجودة' },
];

export function HeroTrustBadges() {
  return (
    <SlideUpView delay={0.55} className="mt-8 flex flex-wrap gap-3">
      {badges.map((badge) => (
        <div
          key={badge.label}
          className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-background/80 px-3 py-2 shadow-sm backdrop-blur-sm"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <badge.icon className="h-4 w-4 text-primary" aria-hidden />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-primary">{badge.label}</p>
            <p className="text-[10px] text-text-muted">{badge.sub}</p>
          </div>
        </div>
      ))}
    </SlideUpView>
  );
}

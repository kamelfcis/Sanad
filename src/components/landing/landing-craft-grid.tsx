'use client';

import Link from 'next/link';
import { Droplets, Zap, Hammer, PaintBucket, Wind, Brush, Grid2x2, Gem } from 'lucide-react';
import { HoverLift, SlideUpView, StaggerChildren, StaggerItem } from '@/components/animations';
import { TECHNICIAN_TRADE_SPECIALTIES } from '@/lib/constants/technician-registration';
import { colors } from '@/lib/design-system';
import type { LucideIcon } from 'lucide-react';

const CRAFT_ICONS: Record<string, LucideIcon> = {
  plumbing: Droplets,
  electrical: Zap,
  carpentry: Hammer,
  plaster: Brush,
  'ac-repair': Wind,
  painting: PaintBucket,
  tiling: Grid2x2,
  marble: Gem,
};

const CRAFT_TONES: Record<string, string> = {
  plumbing: colors.secondary,
  electrical: colors.primary,
  carpentry: colors.secondaryLight,
  plaster: colors.accent,
  'ac-repair': colors.secondary,
  painting: colors.primary,
  tiling: colors.secondaryLight,
  marble: colors.accent,
};

export function LandingCraftGrid() {
  const crafts = TECHNICIAN_TRADE_SPECIALTIES.slice(0, 8);

  return (
    <section id="services" className="scroll-mt-24 bg-background px-4 py-16 md:px-6 md:py-24 lg:px-8" dir="rtl">
      <div className="mx-auto max-w-6xl">
        <SlideUpView className="mb-10 text-center md:mb-14">
          <h2
            className="text-pretty text-3xl font-bold text-text-primary md:text-4xl"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            حِرف سند
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-text-secondary md:text-lg">
            اختار الحرفة وتصفّح الفنيين والمقاولين المسجّلين عليها.
          </p>
        </SlideUpView>

        <StaggerChildren className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {crafts.map((craft) => {
            const Icon = CRAFT_ICONS[craft.value] ?? Hammer;
            const tone = CRAFT_TONES[craft.value] ?? colors.secondary;
            return (
              <StaggerItem key={craft.value}>
                <HoverLift>
                  <Link
                    href={`/services?specialty=${encodeURIComponent(craft.value)}`}
                    className="flex min-h-[7.5rem] flex-col items-start gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm transition-colors hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:bg-card md:min-h-[8.5rem] md:p-5"
                  >
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ background: `${tone}18`, color: tone }}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span
                      className="text-base font-semibold text-text-primary"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      {craft.label}
                    </span>
                  </Link>
                </HoverLift>
              </StaggerItem>
            );
          })}
        </StaggerChildren>
      </div>
    </section>
  );
}

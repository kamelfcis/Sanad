'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { BadgeCheck, Star, Shield } from 'lucide-react';
import { OptimizedImage } from '@/components/shared/optimized-image';
import { SlideUp } from '@/components/animations';
import { colors } from '@/lib/design-system';

const highlights = [
  { icon: BadgeCheck, text: 'فنيون معتمدون وموثوقون' },
  { icon: Shield, text: 'خدمات مضمونة الجودة' },
  { icon: Star, text: 'تقييم ٤.٩ ★ من آلاف العملاء' },
];

export function SplitLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white lg:flex-row">
      <div className="relative flex min-h-[50vh] flex-col justify-end overflow-hidden lg:min-h-screen lg:w-[55%]">
        <OptimizedImage
          src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&q=80"
          alt="خدمات منزلية احترافية"
          fill
          sizes="55vw"
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

        <div className="relative z-10 p-8 lg:p-16">
          <Link href="/" className="mb-8 flex items-center gap-2">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})` }}
            >
              <span className="text-lg font-bold text-white">س</span>
            </div>
            <span className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-cairo)' }}>
              سند
            </span>
          </Link>

          <SlideUp>
            <h1
              className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {title}
            </h1>
          </SlideUp>
          <SlideUp delay={0.1}>
            <p className="mb-8 max-w-md text-lg text-white/80">{subtitle}</p>
          </SlideUp>

          <SlideUp delay={0.2} className="space-y-3">
            {highlights.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                  <item.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm text-white/90">{item.text}</span>
              </div>
            ))}
          </SlideUp>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 hidden lg:block"
          >
            <p className="text-sm text-white/60">© 2026 سند — جميع الحقوق محفوظة</p>
          </motion.div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-y-auto bg-white p-6 lg:p-16">
        <SlideUp className="w-full max-w-md">{children}</SlideUp>
      </div>
    </div>
  );
}

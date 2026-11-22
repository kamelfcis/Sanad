'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Pause, Play, ShieldCheck, Smartphone, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/shared/optimized-image';
import { mapHeroSlideToDisplay } from '@/lib/hero-slides/queries';
import type { HeroSlide } from '@/lib/hero-slides/types';
import { colors } from '@/lib/design-system';

const TRUST_CHIPS = [
  { icon: ShieldCheck, label: 'موثّقون من الإدارة' },
  { icon: Wallet, label: 'دفع إنستاباي/فودافون كاش' },
  { icon: Smartphone, label: 'متابعة من التطبيق' },
] as const;

const overlayStyle = {
  background: [
    `linear-gradient(to top, rgba(11, 23, 32, 0.94) 0%, rgba(25, 78, 91, 0.72) 46%, rgba(11, 23, 32, 0.55) 100%)`,
    `linear-gradient(90deg, rgba(11, 23, 32, 0.28) 0%, rgba(25, 78, 91, 0.4) 42%, rgba(11, 23, 32, 0.82) 100%)`,
  ].join(', '),
} as const;

const FALLBACK_SLIDES = [
  {
    id: 'fallback-hero',
    src: '',
    alt: 'سند',
    title: 'سند — خدمات منزلية',
    subtitle: 'خدمة احترافية',
    iconKey: null,
    rotate: 0,
  },
];

interface LandingHeroProps {
  initialSlides?: HeroSlide[];
}

export function LandingHero({ initialSlides = [] }: LandingHeroProps) {
  const [slides, setSlides] = useState<HeroSlide[]>(initialSlides);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (initialSlides.length > 0) return;
    void fetch('/api/hero-slides')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setSlides(Array.isArray(data) ? data : []))
      .catch(() => setSlides([]));
  }, [initialSlides.length]);

  useEffect(() => {
    if (slides.length <= 1 || paused || reduceMotion) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [slides.length, paused, reduceMotion]);

  const displaySlides = useMemo(
    () =>
      slides.length > 0 ? slides.map((slide, index) => mapHeroSlideToDisplay(slide, index)) : FALLBACK_SLIDES,
    [slides],
  );

  const activeSlide = displaySlides[activeIndex] ?? displaySlides[0];

  return (
    <section
      className="relative isolate min-h-[34rem] overflow-hidden md:min-h-[40rem] lg:min-h-[min(85vh,44rem)]"
      dir="rtl"
      data-testid="hero-carousel"
      aria-roledescription="carousel"
      aria-label="إعلانات الصفحة الرئيسية"
    >
      {displaySlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ${
            index === activeIndex ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden={index !== activeIndex}
        >
          {slide.src ? (
            <OptimizedImage
              src={slide.src}
              alt=""
              fill
              priority={index === 0}
              fetchPriority={index === 0 ? 'high' : undefined}
              loading={index === 0 ? 'eager' : 'lazy'}
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.secondaryLight} 55%, ${colors.foreground} 100%)`,
              }}
            />
          )}
        </div>
      ))}

      <div className="absolute inset-0" style={overlayStyle} aria-hidden />

      <div className="relative z-10 mx-auto flex min-h-[34rem] max-w-6xl flex-col justify-end px-4 pb-10 pt-28 md:min-h-[40rem] md:px-6 md:pb-14 md:pt-32 lg:min-h-[min(85vh,44rem)] lg:px-8">
        <div className="max-w-xl md:max-w-2xl">
          <h1
            className="text-pretty text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            صنايعي موثّق لبيتك. مقاول لمشروعك.
          </h1>
          <p className="mt-4 max-w-lg text-pretty text-base leading-relaxed text-white/85 md:text-lg">
            فني لحرفة واحدة وحجز سريع. مقاول لعرض سعر وسعة فريق.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 min-w-[200px] rounded-xl bg-primary-strong text-lg text-white shadow-lg focus-visible:ring-white"
            >
              <Link href="/services?providerRole=technician" data-testid="cta-book-technician">
                احجز فني
              </Link>
            </Button>
            <Link
              href="/services?providerRole=contractor"
              data-testid="cta-request-contractor"
              className="inline-flex h-12 min-w-[200px] items-center justify-center rounded-xl border-2 border-white px-8 text-lg font-medium text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
            >
              اطلب مقاول
            </Link>
          </div>
          <ul className="mt-8 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-2.5">
            {TRUST_CHIPS.map((chip) => (
              <li
                key={chip.label}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white/95 backdrop-blur-sm"
              >
                <chip.icon className="h-4 w-4 shrink-0" aria-hidden />
                {chip.label}
              </li>
            ))}
          </ul>
        </div>

        {activeSlide && (
          <div className="mt-8 flex flex-col items-start gap-3">
            {(activeSlide.title || activeSlide.subtitle) && (
              <div>
                {activeSlide.title && (
                  <p className="text-sm font-semibold text-white" data-testid="hero-slide-title">
                    {activeSlide.title}
                  </p>
                )}
                {activeSlide.subtitle && (
                  <p className="text-xs text-white/75" data-testid="hero-slide-subtitle">
                    {activeSlide.subtitle}
                  </p>
                )}
              </div>
            )}
            {displaySlides.length > 1 && (
              <div className="flex items-center gap-2">
                {displaySlides.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    aria-label={`الإعلان ${index + 1}`}
                    aria-current={index === activeIndex ? true : undefined}
                    className="flex h-6 w-6 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    onClick={() => setActiveIndex(index)}
                  >
                    <span
                      className={`block rounded-full transition-all ${
                        index === activeIndex ? 'h-2 w-6 bg-primary-strong' : 'h-2 w-2 bg-white/40'
                      }`}
                    />
                  </button>
                ))}
                <button
                  type="button"
                  className="ms-2 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  aria-label={paused ? 'تشغيل الإعلانات' : 'إيقاف الإعلانات مؤقتاً'}
                  onClick={() => setPaused((value) => !value)}
                >
                  {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

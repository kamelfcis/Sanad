'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Shield,
  Zap,
  Headphones,
  Star,
  ChevronRight,
  ChevronLeft,
  Users,
} from 'lucide-react';
import { OptimizedImage } from '@/components/shared/optimized-image';
import { HeroTrustBadges } from '@/components/landing/hero-trust-badges';
import { SlideUp, SlideUpView } from '@/components/animations';
import { colors } from '@/lib/design-system';
import { useHeroSlides } from '@/hooks/use-hero-slides';
import { getCategoryIcon } from '@/lib/icons/category-icons';
import { cn } from '@/lib/utils/cn';

const features = [
  { icon: Users, label: 'فنيون معتمدون', color: colors.primary },
  { icon: Shield, label: 'ضمان الجودة', color: colors.success },
  { icon: Zap, label: 'استجابة سريعة', color: colors.warning },
  { icon: Headphones, label: 'دعم 24/7', color: '#8B5CF6' },
];

const partners = [
  { name: 'معروف', color: '#1B3A4B' },
  { name: 'السعودية', color: '#006C35' },
  { name: 'وزارة التجارة', color: '#003366' },
  { name: 'ZATCA', color: colors.secondary },
];

export function HeroSection() {
  const { slides: heroImages, isLoading } = useHeroSlides();
  const showCarousel = !isLoading && heroImages.length > 0;
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    setCurrentSlide(0);
  }, [heroImages.length]);

  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying || heroImages.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, heroImages.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);
    setIsAutoPlaying(false);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-surface pt-16 md:pt-[72px] lg:pt-20">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] dark:opacity-30" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-8 md:px-12 lg:px-20 lg:pb-20 lg:pt-16">
        <div
          className={cn(
            'grid items-center gap-12',
            showCarousel && 'lg:grid-cols-2 lg:gap-16',
          )}
        >
          <div>
            <SlideUp className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">خدمات منزلية احترافية تثق بها</span>
            </SlideUp>

            <SlideUp delay={0.1}>
              <h1
                className="mb-6 text-4xl font-bold leading-tight text-text-primary md:text-5xl lg:text-6xl"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                كل خدمة تحتاجها...
                <br />
                <span className="text-gradient">في مكان واحد</span>
              </h1>
            </SlideUp>

            <SlideUp delay={0.2}>
              <p className="mb-8 max-w-lg text-lg leading-relaxed text-text-secondary">
                احجز أفضل الفنيين والمتخصصين خلال دقائق مع ضمان الجودة والموثوقية. دعم على مدار الساعة لجميع احتياجاتك.
              </p>
            </SlideUp>

            <SlideUp delay={0.3} className="mb-8 flex flex-col items-start gap-4 sm:flex-row">
              <Link
                href="/auth/register?role=customer"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-accent px-8 py-4 text-base font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/20 active:scale-[0.98]"
              >
                احجز خدمة الآن
                <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
              </Link>
              <Link
                href="#services"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-border bg-background px-8 py-4 text-base font-bold text-text-primary transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md active:scale-[0.98]"
              >
                استكشف الخدمات
              </Link>
            </SlideUp>

            <SlideUp delay={0.4} className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {features.map((feature) => (
                <div
                  key={feature.label}
                  className="flex flex-col items-center gap-2 rounded-xl bg-muted/50 px-4 py-3 text-center"
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${feature.color}12` }}
                  >
                    <feature.icon className="h-5 w-5" style={{ color: feature.color }} />
                  </div>
                  <span className="text-xs font-semibold text-text-secondary">{feature.label}</span>
                </div>
              ))}
            </SlideUp>

            <SlideUp delay={0.5} className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-gradient-to-br from-primary/20 to-accent/20 text-xs font-bold text-primary"
                  >
                    {i}
                  </div>
                ))}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                  <span className="mr-1 text-sm font-bold text-text-primary">4.9</span>
                </div>
                <span className="text-xs text-text-secondary">من 10,000+ عميل راضٍ</span>
              </div>
            </SlideUp>

            <HeroTrustBadges />
          </div>

          {showCarousel && (
          <SlideUpView delay={0.2} className="relative" data-testid="hero-carousel">
            <div className="relative h-[400px] md:h-[500px] lg:h-[550px]">
              <AnimatePresence mode="wait">
                {heroImages.map((img, index) => {
                  const offset = (index - currentSlide + heroImages.length) % heroImages.length;
                  const isCenter = offset === 0;
                  const isLeft = offset === 1 || offset === heroImages.length - 1;
                  const isFar = offset === 2 || offset === heroImages.length - 2;

                  if (isFar) return null;

                  const SlideIcon = getCategoryIcon(img.iconKey);

                  return (
                    <motion.div
                      key={img.id}
                      initial={{ opacity: 0, scale: 0.8, rotate: img.rotate }}
                      animate={{
                        opacity: isCenter ? 1 : 0.6,
                        scale: isCenter ? 1 : isLeft ? 0.85 : 0.7,
                        x: isCenter ? 0 : isLeft ? (offset === 1 ? 60 : -60) : 0,
                        rotate: isCenter ? 0 : img.rotate * 0.5,
                        zIndex: isCenter ? 10 : 5,
                      }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="absolute inset-0"
                    >
                      <div className="relative h-full w-full overflow-hidden rounded-2xl shadow-xl">
                        <OptimizedImage
                          src={img.src}
                          alt={img.alt}
                          fill
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          priority={index === 0}
                          loading={index === 0 ? 'eager' : 'lazy'}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                        <div className="absolute bottom-6 right-6 left-6 rounded-xl bg-white/95 p-4 shadow-lg backdrop-blur">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                              <SlideIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <p
                                className="text-lg font-bold text-text-primary"
                                style={{ fontFamily: 'var(--font-heading)' }}
                                data-testid={isCenter ? 'hero-slide-title' : undefined}
                              >
                                {img.title}
                              </p>
                              <p className="text-sm text-text-secondary" data-testid={isCenter ? 'hero-slide-subtitle' : undefined}>
                                {img.subtitle}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              <button
                type="button"
                onClick={prevSlide}
                aria-label="الصورة السابقة"
                className="absolute left-4 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:bg-primary hover:text-white"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                aria-label="الصورة التالية"
                className="absolute right-4 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:bg-primary hover:text-white"
              >
                <ChevronRight className="h-6 w-6" />
              </button>

              <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                {heroImages.map((img, index) => (
                  <button
                    key={img.id}
                    type="button"
                    aria-label={`الانتقال إلى الشريحة ${index + 1}`}
                    onClick={() => {
                      setCurrentSlide(index);
                      setIsAutoPlaying(false);
                    }}
                    className={`min-h-6 min-w-6 rounded-full transition-all duration-300 ${
                      index === currentSlide
                        ? 'w-8 bg-gradient-to-r from-primary to-accent'
                        : 'bg-text-muted/30 hover:bg-text-muted/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </SlideUpView>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-muted/30 py-8">
        <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
          <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
            <p className="text-sm font-semibold text-text-secondary">شركاء النجاح</p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              {partners.map((partner) => (
                <div
                  key={partner.name}
                  className="flex items-center gap-2 rounded-lg bg-background px-4 py-2 shadow-sm"
                >
                  <span className="text-sm font-bold" style={{ color: partner.color }}>
                    {partner.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-primary to-accent py-12">
        <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { value: '4.9', suffix: '', label: 'متوسط التقييم', icon: Star },
              { value: '50', suffix: '+', label: 'مدينة', icon: Shield },
              { value: '2,500', suffix: '+', label: 'فني معتمد', icon: Users },
              { value: '10,000', suffix: '+', label: 'طلب مكتمل', icon: Zap },
            ].map((stat, i) => (
              <SlideUpView
                key={stat.label}
                delay={i * 0.1}
                className="rounded-2xl bg-white/10 p-6 text-center backdrop-blur"
              >
                <div className="mb-2 flex justify-center">
                  <stat.icon className="h-6 w-6 text-white/80" />
                </div>
                <div className="mb-1 text-3xl font-bold text-white md:text-4xl">
                  {stat.value}
                  {stat.suffix}
                </div>
                <p className="text-sm text-white/80" style={{ fontFamily: 'var(--font-heading)' }}>
                  {stat.label}
                </p>
              </SlideUpView>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

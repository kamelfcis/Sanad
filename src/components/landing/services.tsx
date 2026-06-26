'use client';

import { Zap, Wrench, Wind, Hammer, PaintBucket, Home } from 'lucide-react';
import { OptimizedImage } from '@/components/shared/optimized-image';
import { HoverLift, SlideUpView, StaggerChildren, StaggerItem } from '@/components/animations';
import { colors } from '@/lib/design-system';

const services = [
  {
    icon: Zap,
    name: 'كهرباء',
    description: 'جميع أعمال الكهرباء والتمديدات',
    color: colors.primary,
    img: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&q=60',
  },
  {
    icon: Wrench,
    name: 'سباكة',
    description: 'تركيب وإصلاح السباكة',
    color: colors.secondary,
    img: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&q=60',
  },
  {
    icon: Wind,
    name: 'تكييف',
    description: 'تركيب وصيانة المكيفات',
    color: colors.primaryLight,
    img: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=60',
  },
  {
    icon: Hammer,
    name: 'نجارة',
    description: 'أعمال النجارة والأثاث',
    color: colors.success,
    img: 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=400&q=60',
  },
  {
    icon: PaintBucket,
    name: 'دهانات',
    description: 'دهان وتشطيب الجدران',
    color: colors.warning,
    img: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=400&q=60',
  },
  {
    icon: Home,
    name: 'أجهزة منزلية',
    description: 'صيانة وإصلاح الأجهزة',
    color: colors.destructive,
    img: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=60',
  },
];

export function ServicesSection() {
  return (
    <section className="px-6 py-24 md:px-12 lg:px-20" id="services">
      <div className="mx-auto max-w-7xl">
        <SlideUpView className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            خدماتنا
          </span>
          <h2
            className="mb-4 text-3xl font-bold text-text-primary md:text-4xl"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            كل ما تحتاجه لمنزلك
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-text-secondary">
            نوفر لك أفضل الفنيين المتخصصين في جميع مجالات الصيانة المنزلية
          </p>
        </SlideUpView>

        <StaggerChildren className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <StaggerItem key={service.name}>
              <HoverLift className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-background transition-all duration-200 hover:border-primary/30 hover:shadow-lg">
                <div className="relative h-40 overflow-hidden">
                  <OptimizedImage
                    src={service.img}
                    alt={service.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    loading="lazy"
                    className="transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
                <div className="p-5">
                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ background: `${service.color}15` }}
                    >
                      <service.icon className="h-5 w-5" style={{ color: service.color }} />
                    </div>
                    <h3
                      className="text-lg font-semibold text-text-primary"
                      style={{ fontFamily: 'var(--font-cairo)' }}
                    >
                      {service.name}
                    </h3>
                  </div>
                  <p className="text-sm text-text-secondary">{service.description}</p>
                </div>
              </HoverLift>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}

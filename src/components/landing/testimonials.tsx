'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, Star } from 'lucide-react';
import { OptimizedImage } from '@/components/shared/optimized-image';
import { SlideUpView } from '@/components/animations';

const testimonials = [
  {
    name: 'أحمد السالم',
    text: 'خدمة ممتازة جداً! الفني وصل في الوقت المحدد وأنجز العمل بكفاءة عالية. أنصح الجميع باستخدام سند.',
    rating: 5,
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=60',
  },
  {
    name: 'نورة العتيبي',
    text: 'منصة رائعة وسهلة الاستخدام. حجزت فني تكييف وكانت التجربة ممتازة من البداية للنهاية.',
    rating: 5,
    img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=60',
  },
  {
    name: 'عبدالله القحطاني',
    text: 'سند غيرت مفهوم الصيانة المنزلية عندي. أسعار مناسبة وخدمة احترافية.',
    rating: 5,
    img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=60',
  },
  {
    name: 'سارة الفهد',
    text: 'أصبحت أعتمد على سند في جميع احتياجات المنزل. فنيين محترفين وخدمة عملاء ممتازة.',
    rating: 4,
    img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=60',
  },
];

export function TestimonialsSection() {
  const [current, setCurrent] = useState(0);

  return (
    <section id="reviews" className="bg-surface px-6 py-24 md:px-12 lg:px-20">
      <div className="mx-auto max-w-3xl">
        <SlideUpView className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            آراء العملاء
          </span>
          <h2
            className="mb-4 text-3xl font-bold text-text-primary md:text-4xl"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            ماذا يقول عنا عملاؤنا
          </h2>
        </SlideUpView>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-border bg-background p-10 shadow-sm"
            >
              <div className="mb-4 flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < testimonials[current].rating
                        ? 'fill-accent text-accent'
                        : 'text-border'
                    }`}
                  />
                ))}
              </div>
              <p
                className="mb-8 text-lg leading-relaxed text-text-secondary"
                style={{ fontFamily: 'var(--font-cairo)' }}
              >
                &ldquo;{testimonials[current].text}&rdquo;
              </p>
              <div className="flex items-center gap-4">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
                  <OptimizedImage
                    src={testimonials[current].img}
                    alt={testimonials[current].name}
                    fill
                    sizes="48px"
                    loading="lazy"
                  />
                </div>
                <div>
                  <p className="font-semibold text-text-primary">{testimonials[current].name}</p>
                  <p className="text-sm text-text-secondary">عميل</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              type="button"
              aria-label="الشهادة السابقة"
              onClick={() => setCurrent((c) => (c === 0 ? testimonials.length - 1 : c - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-text-secondary transition-all hover:border-primary/30 hover:text-primary"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`الانتقال إلى الشهادة ${i + 1}`}
                  onClick={() => setCurrent(i)}
                  className={`min-h-6 min-w-6 rounded-full transition-all ${
                    i === current
                      ? 'w-8 bg-gradient-to-r from-primary to-accent'
                      : 'bg-border'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              aria-label="الشهادة التالية"
              onClick={() => setCurrent((c) => (c === testimonials.length - 1 ? 0 : c + 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-text-secondary transition-all hover:border-primary/30 hover:text-primary"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

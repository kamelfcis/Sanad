'use client';

import { motion } from 'framer-motion';
import { BadgeCheck, Shield, Zap, Star } from 'lucide-react';

const trustItems = [
  { icon: BadgeCheck, title: 'فنيون معتمدون', description: 'جميع الفنيين موثوقون وتم التحقق منهم' },
  { icon: Shield, title: 'منصة آمنة', description: 'معلوماتك محمية بأعلى معايير الأمان' },
  { icon: Zap, title: 'استجابة سريعة', description: 'يصل الفني إليك في أقل من ساعة' },
  { icon: Star, title: 'رضا العميل', description: 'نسبة رضا تتجاوز ٩٥٪ من عملائنا' },
];

export function TrustSection() {
  return (
    <section className="px-6 py-24 md:px-12 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">لماذا سند؟</span>
          <h2 className="mb-4 text-3xl font-bold text-text-primary md:text-4xl" style={{ fontFamily: 'var(--font-heading)' }}>
            نضع ثقتك في المقام الأول
          </h2>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-background p-8 text-center transition-all duration-200 hover:border-primary/20 hover:shadow-lg"
            >
              <div className="mb-5 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-sm transition-transform duration-200">
                  <item.icon className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
              <h3 className="mb-3 text-lg font-semibold text-text-primary" style={{ fontFamily: 'var(--font-cairo)' }}>{item.title}</h3>
              <p className="text-sm text-text-secondary">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

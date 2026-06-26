'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, UserPlus } from 'lucide-react';

export function CTASection() {
  return (
    <section id="contact" className="bg-surface px-6 py-24 md:px-12 lg:px-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#FF6B00] to-[#FF8A34] px-8 py-16 text-center shadow-xl md:px-20 md:py-24"
      >
        <h2 className="mb-4 text-3xl font-bold text-white md:text-5xl" style={{ fontFamily: 'var(--font-heading)' }}>
          ابدأ الآن مع سند
        </h2>
        <p className="mx-auto mb-10 max-w-xl text-lg text-white/80">
          انضم إلى آلاف العملاء الذين يثقون في سند لجميع خدمات الصيانة المنزلية
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/auth/register?role=customer"
            className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-[#FF6B00] shadow-sm transition-all hover:shadow-md"
          >
            <UserPlus className="h-5 w-5" />
            اطلب خدمة
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
          </Link>
          <Link href="/auth/register-technician"
            className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white/10"
          >
            انضم كفني
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

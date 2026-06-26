'use client';

import { motion } from 'framer-motion';
import { Smartphone, QrCode, Download, Star } from 'lucide-react';
import Link from 'next/link';

export function AppPreviewSection() {
  return (
    <section className="relative px-6 py-24 md:px-12 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="glass relative overflow-hidden rounded-3xl">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #FF6B00, transparent)' }} />
          <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #194E5B, transparent)' }} />

          <div className="relative z-10 grid items-center gap-12 px-8 py-16 md:grid-cols-2 md:px-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="mb-4 inline-block rounded-full border border-[#FF6B00]/30 bg-[#FF6B00]/10 px-4 py-1.5 text-sm text-[#FF8A34]">
                تطبيق الجوال
              </span>
              <h2
                className="mb-4 text-3xl font-bold text-white md:text-5xl"
                style={{ fontFamily: 'var(--font-cairo)' }}
              >
                حمّل تطبيق سند الآن
              </h2>
              <p className="mb-8 text-lg text-[#9EB0B7]">
                احصل على تجربة أفضل مع تطبيق سند للجوال. احجز الخدمات، تابع الفني، وادفع بأمان.
              </p>

              <div className="mb-8 grid grid-cols-2 gap-4">
                {[
                  { icon: QrCode, text: 'مسح ضوئي سريع' },
                  { icon: Star, text: 'تقييم الخدمة' },
                  { icon: Smartphone, text: 'تتبع الفني' },
                  { icon: Download, text: 'حجوزات فورية' },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF6B00]/10">
                      <item.icon className="h-5 w-5 text-[#FF8A34]" />
                    </div>
                    <span className="text-sm text-white">{item.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="#"
                  className="glass flex items-center gap-3 rounded-2xl px-6 py-4 transition-all hover:bg-white/10"
                >
                  <Download className="h-6 w-6 text-white" />
                  <div>
                    <p className="text-xs text-[#9EB0B7]">حمّله من</p>
                    <p className="text-sm font-semibold text-white">Google Play</p>
                  </div>
                </Link>
                <Link
                  href="#"
                  className="glass flex items-center gap-3 rounded-2xl px-6 py-4 transition-all hover:bg-white/10"
                >
                  <Download className="h-6 w-6 text-white" />
                  <div>
                    <p className="text-xs text-[#9EB0B7]">حمّله من</p>
                    <p className="text-sm font-semibold text-white">App Store</p>
                  </div>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="hidden md:flex md:justify-center"
            >
              <div className="relative">
                <div className="flex h-[400px] w-[220px] items-center justify-center rounded-[3rem] border-4 border-[#1A3843]">
                  <div className="flex h-full w-full flex-col items-center justify-center rounded-[2.5rem] bg-gradient-to-b from-[#FF6B00]/20 to-[#194E5B]/20 p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
                      <span className="text-lg font-bold text-white">س</span>
                    </div>
                    <p className="mb-2 text-center text-lg font-bold text-white">سند</p>
                    <p className="mb-6 text-center text-xs text-[#9EB0B7]">ابحث عن الخدمة</p>
                    <div className="w-full space-y-3">
                      {['كهرباء', 'سباكة', 'تكييف'].map((s) => (
                        <div key={s} className="glass rounded-xl px-4 py-3 text-sm text-white">
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

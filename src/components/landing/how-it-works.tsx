'use client';

import { motion } from 'framer-motion';
import { Search, MapPin, UserCheck } from 'lucide-react';

const steps = [
  { icon: Search, title: 'اختر الخدمة', description: 'تصفح قائمة الخدمات المتاحة واختر ما تحتاجه لمنزلك', color: '#FF6B00' },
  { icon: MapPin, title: 'حدد موقعك', description: 'أدخل موقعك وسنقوم بتحديد أفضل الفنيين القريبين منك', color: '#194E5B' },
  { icon: UserCheck, title: 'يصل الفني إليك', description: 'سيصل الفني المعتمد إلى منزلك في الوقت المحدد', color: '#FF8A34' },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-surface px-6 py-24 md:px-12 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full bg-[#FF6B00]/5 px-4 py-1.5 text-sm font-medium text-[#FF6B00]">كيف تعمل</span>
          <h2 className="mb-4 text-3xl font-bold text-[#0F172A] md:text-4xl" style={{ fontFamily: 'var(--font-heading)' }}>
            ثلاث خطوات بسيطة
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[#475569]">احصل على خدمات الصيانة المنزلية بأسهل وأسرع طريقة</p>
        </motion.div>

        <div className="relative grid gap-8 md:grid-cols-3">
          <div className="absolute left-1/2 top-16 hidden h-0.5 w-2/3 -translate-x-1/2 bg-gradient-to-r from-[#FF6B00] via-[#194E5B] to-[#FF8A34] opacity-30 md:block" />

          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative flex flex-col items-center text-center"
            >
              <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
                <step.icon className="h-8 w-8" style={{ color: step.color }} />
                <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: step.color }}>{i + 1}</div>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-[#0F172A]" style={{ fontFamily: 'var(--font-cairo)' }}>{step.title}</h3>
              <p className="max-w-xs text-[#475569]">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

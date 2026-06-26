'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  { q: 'كيف يمكنني حجز خدمة؟', a: 'يمكنك حجز خدمة بسهولة من خلال اختيار الخدمة التي تحتاجها، تحديد موقعك، وسيتم إرسال فني معتمد إليك في أسرع وقت.' },
  { q: 'هل الفنيون موثوقون؟', a: 'نعم، جميع الفنيين في سند يتم التحقق منهم بدقة من خلال فحص الهوية والمؤهلات والخبرة السابقة.' },
  { q: 'ما هي طرق الدفع المتاحة؟', a: 'نوفر عدة طرق دفع آمنة تشمل الدفع النقدي، البطاقات الائتمانية، والتحويل البنكي.' },
  { q: 'ماذا إذا لم أكن راضياً عن الخدمة؟', a: 'رضاك هو أولويتنا. إذا لم تكن راضياً عن الخدمة، يمكنك التواصل مع فريق الدعم لدينا وسنعمل على حل المشكلة فوراً.' },
  { q: 'كم من الوقت يستغرق وصول الفني؟', a: 'في معظم الحالات، يصل الفني خلال ساعة من تأكيد الحجز.' },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="px-6 py-24 md:px-12 lg:px-20">
      <div className="mx-auto max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full bg-[#FF6B00]/5 px-4 py-1.5 text-sm font-medium text-[#FF6B00]">الأسئلة الشائعة</span>
          <h2 className="mb-4 text-3xl font-bold text-[#0F172A] md:text-4xl" style={{ fontFamily: 'var(--font-heading)' }}>
            لديك سؤال؟ لدينا الجواب
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03 }}
              className="cursor-pointer rounded-xl border border-[#E2E8F0] bg-white transition-colors hover:border-[#FF6B00]/20"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            >
              <div className="flex items-center justify-between p-5">
                <h3 className="text-base font-medium text-[#0F172A]" style={{ fontFamily: 'var(--font-cairo)' }}>{faq.q}</h3>
                <ChevronDown className={`h-5 w-5 text-[#475569] transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`} />
              </div>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <p className="px-5 pb-5 text-sm leading-relaxed text-[#475569]">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

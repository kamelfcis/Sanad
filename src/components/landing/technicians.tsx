'use client';

import { motion } from 'framer-motion';
import { Star, MapPin, Award } from 'lucide-react';

const technicians = [
  { name: 'محمد الأحمد', specialty: 'كهرباء', rating: 4.9, jobs: 847, city: 'الرياض', verified: true },
  { name: 'خالد السعد', specialty: 'سباكة', rating: 4.8, jobs: 623, city: 'جدة', verified: true },
  { name: 'فهد العمر', specialty: 'تكييف', rating: 4.9, jobs: 956, city: 'الدمام', verified: true },
  { name: 'سعود الراشد', specialty: 'نجارة', rating: 4.7, jobs: 412, city: 'مكة', verified: true },
];

export function TechniciansSection() {
  return (
    <section className="relative px-6 py-24 md:px-12 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <span className="mb-4 inline-block rounded-full border border-[#FF6B00]/30 bg-[#FF6B00]/10 px-4 py-1.5 text-sm text-[#FF8A34]">
            أفضل الفنيين
          </span>
          <h2
            className="mb-4 text-3xl font-bold text-white md:text-5xl"
            style={{ fontFamily: 'var(--font-cairo)' }}
          >
            تعرف على نخبة فنيينا
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[#9EB0B7]">
            فريق من الفنيين المعتمدين ذوي الخبرة العالية في جميع المجالات
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {technicians.map((tech, i) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -8 }}
              className="glass group rounded-2xl p-6 text-center transition-all duration-300"
            >
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full gradient-primary text-2xl font-bold text-white">
                {tech.name[0]}
              </div>
              <h3
                className="mb-1 text-lg font-semibold text-white"
                style={{ fontFamily: 'var(--font-cairo)' }}
              >
                {tech.name}
              </h3>
              <p className="mb-3 text-sm text-[#FF8A34]">{tech.specialty}</p>
              <div className="mb-4 flex items-center justify-center gap-4 text-xs text-[#9EB0B7]">
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-[#FF8A34] text-[#FF8A34]" />
                  {tech.rating}
                </span>
                <span className="flex items-center gap-1">
                  <Award className="h-3.5 w-3.5" />
                  {tech.jobs}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {tech.city}
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#10B981]/10 px-3 py-1 text-xs text-[#10B981]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                موثوق
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

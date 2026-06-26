'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

function AnimatedCounter({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [inView, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

const stats = [
  { value: 10000, suffix: '+', label: 'خدمة منجزة' },
  { value: 2500, suffix: '+', label: 'فني معتمد' },
  { value: 50, suffix: '+', label: 'مدينة' },
  { value: 4.9, suffix: ' ★', label: 'تقييم العملاء' },
];

export function StatsSection() {
  return (
    <section className="bg-gradient-to-br from-primary to-accent px-6 py-20 md:px-12 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="rounded-2xl bg-white/10 p-8 text-center backdrop-blur"
            >
              <div className="mb-2 text-4xl font-bold text-white">
                {stat.value === 4.9 ? <span>4.9</span> : <AnimatedCounter end={stat.value} suffix={stat.suffix} />}
              </div>
              <p className="text-lg text-white/80" style={{ fontFamily: 'var(--font-cairo)' }}>{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

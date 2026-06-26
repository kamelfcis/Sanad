'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { animation } from '@/lib/design-system';

interface FadeInProps extends HTMLMotionProps<'div'> {
  delay?: number;
  duration?: number;
}

export function FadeIn({
  children,
  delay = 0,
  duration = animation.duration.normal,
  ...props
}: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration, delay, ease: animation.easing.out }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function FadeInView({
  children,
  delay = 0,
  duration = animation.duration.normal,
  ...props
}: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration, delay, ease: animation.easing.out }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { animation } from '@/lib/design-system';

interface SlideUpProps extends HTMLMotionProps<'div'> {
  delay?: number;
  duration?: number;
  distance?: number;
}

export function SlideUp({
  children,
  delay = 0,
  duration = animation.duration.normal,
  distance = 20,
  ...props
}: SlideUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: distance }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: animation.easing.out }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function SlideUpView({
  children,
  delay = 0,
  duration = animation.duration.normal,
  distance = 20,
  ...props
}: SlideUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration, delay, ease: animation.easing.out }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

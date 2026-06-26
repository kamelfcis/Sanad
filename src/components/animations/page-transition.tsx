'use client';

import { motion } from 'framer-motion';
import { animation } from '@/lib/design-system';
import type { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: animation.duration.fast, ease: animation.easing.out }}
    >
      {children}
    </motion.div>
  );
}

'use client';

import { motion } from 'framer-motion';
import { animation } from '@/lib/design-system';
import type { ReactNode } from 'react';

interface StaggerChildrenProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delayChildren?: number;
}

const containerVariants = (stagger: number, delayChildren: number) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: stagger,
      delayChildren,
    },
  },
});

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: animation.duration.normal, ease: animation.easing.out },
  },
};

export function StaggerChildren({
  children,
  className,
  stagger = 0.08,
  delayChildren = 0,
}: StaggerChildrenProps) {
  return (
    <motion.div
      className={className}
      variants={containerVariants(stagger, delayChildren)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}

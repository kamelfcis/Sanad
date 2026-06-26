'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { animation } from '@/lib/design-system';

interface HoverLiftProps extends HTMLMotionProps<'div'> {
  lift?: number;
}

export function HoverLift({
  children,
  lift = 4,
  className,
  ...props
}: HoverLiftProps) {
  return (
    <motion.div
      className={className}
      whileHover={{ y: -lift, transition: { duration: animation.duration.fast } }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

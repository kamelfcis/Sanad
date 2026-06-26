'use client';

import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!mounted) return <div className="h-8 w-[60px]" aria-hidden />;

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative flex h-8 w-[60px] shrink-0 items-center rounded-full bg-[#E2E8F0] p-1 transition-colors duration-300 dark:bg-[#1E3A4A]"
      aria-label={isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
    >
      <motion.div
        animate={{ x: isDark ? 26 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm dark:bg-[#0B1720]"
      >
        {isDark ? (
          <Moon className="h-3.5 w-3.5 text-[#FF8A34]" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-[#FF6B00]" />
        )}
      </motion.div>
    </button>
  );
}

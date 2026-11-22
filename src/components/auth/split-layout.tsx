'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

export function SplitLayout({
  children,
  title = 'خدمات منزلية موثوقة في مكان واحد',
  subtitle = 'اطلب صنايعي، تابع الحجز، وادفع بسهولة عبر إنستاباي أو فودافون كاش.',
  className,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div dir="rtl" className={cn('grid min-h-screen lg:grid-cols-2', className)}>
      <div className="hidden flex-col justify-between bg-gradient-to-br from-primary to-accent p-10 text-white lg:flex">
        <Link href="/" className="text-lg font-bold">
          سند
        </Link>
        <div>
          <h2 className="text-3xl font-bold text-pretty">{title}</h2>
          <p className="mt-3 max-w-md text-white/80">{subtitle}</p>
        </div>
        <p className="text-sm text-white/70">منصة سند</p>
      </div>
      <div className="flex items-center justify-center bg-background p-6">
        {children}
      </div>
    </div>
  );
}

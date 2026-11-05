'use client';

import Link from 'next/link';

export function SplitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-gradient-to-br from-primary to-accent p-10 text-white lg:flex">
        <Link href="/" className="text-lg font-bold">
          سند
        </Link>
        <div>
          <h2 className="text-3xl font-bold text-pretty">خدمات منزلية موثوقة في مكان واحد</h2>
          <p className="mt-3 max-w-md text-white/80">
            اطلب صنايعي، تابع الحجز، وادفع بسهولة عبر إنستاباي أو فودافون كاش.
          </p>
        </div>
        <p className="text-sm text-white/70">منصة سند</p>
      </div>
      <div className="flex items-center justify-center bg-background p-6">
        {children}
      </div>
    </div>
  );
}

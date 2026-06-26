'use client';

import { PageTransition } from '@/components/animations';
import type { ReactNode } from 'react';

export function LandingPageClient({ children }: { children: ReactNode }) {
  return (
    <PageTransition>
      <main className="min-h-screen bg-background">{children}</main>
    </PageTransition>
  );
}

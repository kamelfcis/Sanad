import type { ReactNode } from 'react';

export function LandingPageClient({ children }: { children: ReactNode }) {
  return <main className="min-h-screen bg-background">{children}</main>;
}

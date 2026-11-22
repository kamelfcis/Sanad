import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata('تسجيل الدخول', undefined, '/auth/login');

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main id="main-content">{children}</main>;
}

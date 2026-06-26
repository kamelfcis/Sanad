import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata(
  'تسجيل الدخول',
  'سجّل دخولك إلى حساب سند للوصول إلى خدماتك وحجوزاتك.',
);

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

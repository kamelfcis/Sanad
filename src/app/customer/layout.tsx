import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { AuthGuard } from '@/components/shared/auth-guard';
import { CustomerLayoutChrome } from '@/components/customer/customer-layout-chrome';

export const metadata: Metadata = pageMetadata(
  'لوحة العميل',
  'إدارة حجوزاتك وخدماتك المنزلية على منصة سند.',
);

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['customer']}>
      <CustomerLayoutChrome>{children}</CustomerLayoutChrome>
    </AuthGuard>
  );
}

import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { AuthGuard } from '@/components/shared/auth-guard';
import { Header } from '@/components/shared/header';

export const metadata: Metadata = pageMetadata(
  'لوحة العميل',
  'إدارة حجوزاتك وخدماتك المنزلية على منصة سند.',
);

const customerNavItems = [
  { label: 'الخدمات', href: '/customer/services' },
  { label: 'حجوزاتي', href: '/customer/bookings' },
  { label: 'المحادثات', href: '/customer/chat' },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['customer']}>
      <div className="flex min-h-screen flex-col">
        <Header navItems={customerNavItems} />
        <main className="flex-1">{children}</main>
      </div>
    </AuthGuard>
  );
}

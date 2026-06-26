import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { getServerAuthSession } from '@/lib/auth/server-session';
import { AuthBootstrap } from '@/components/shared/auth-bootstrap';
import { AuthGuard } from '@/components/shared/auth-guard';
import { Header } from '@/components/shared/header';
import { DashboardSessionManager } from '@/components/shared/dashboard-session-manager';

export const metadata: Metadata = pageMetadata(
  'لوحة العميل',
  'إدارة حجوزاتك وخدماتك المنزلية على منصة سند.',
);

const customerNavItems = [
  { label: 'الخدمات', href: '/services' },
  { label: 'حجوزاتي', href: '/customer/bookings' },
  { label: 'المحادثات', href: '/customer/chat' },
];

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getServerAuthSession();

  return (
    <AuthBootstrap initialUser={user} initialProfile={profile}>
      <AuthGuard allowedRoles={['customer']}>
        <DashboardSessionManager />
        <div className="flex min-h-screen flex-col">
          <Header navItems={customerNavItems} />
          <main className="flex-1">{children}</main>
        </div>
      </AuthGuard>
    </AuthBootstrap>
  );
}

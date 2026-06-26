import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { AuthGuard } from '@/components/shared/auth-guard';
import { Header } from '@/components/shared/header';
import { DashboardSessionManager } from '@/components/shared/dashboard-session-manager';

export const metadata: Metadata = pageMetadata(
  'الإعدادات',
  'إدارة إعدادات حسابك وأمان جلساتك على منصة سند.',
);

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['customer', 'technician', 'admin']}>
      <DashboardSessionManager />
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
      </div>
    </AuthGuard>
  );
}

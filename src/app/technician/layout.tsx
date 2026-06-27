import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { getServerAuthSession } from '@/lib/auth/server-session';
import { AuthBootstrap } from '@/components/shared/auth-bootstrap';
import { AuthGuard } from '@/components/shared/auth-guard';
import { Header } from '@/components/shared/header';
import { DashboardSessionManager } from '@/components/shared/dashboard-session-manager';

export const metadata: Metadata = pageMetadata(
  'لوحة الفني',
  'إدارة الوظائف والملف الشخصي على منصة سند.',
);

const technicianNavItems = [
  { label: 'Jobs', href: '/technician/jobs' },
  { label: 'Chat', href: '/technician/chat' },
  { label: 'Profile', href: '/technician/profile' },
];

export default async function TechnicianLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getServerAuthSession();

  return (
    <AuthBootstrap initialUser={user} initialProfile={profile}>
      <AuthGuard allowedRoles={['technician']}>
        <DashboardSessionManager />
        <div className="flex min-h-screen flex-col">
          <Header navItems={technicianNavItems} />
          <main className="flex-1">{children}</main>
        </div>
      </AuthGuard>
    </AuthBootstrap>
  );
}

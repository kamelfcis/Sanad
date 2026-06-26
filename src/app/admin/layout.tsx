import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { getServerAuthSession } from '@/lib/auth/server-session';
import { AuthBootstrap } from '@/components/shared/auth-bootstrap';
import { AdminShell } from '@/app/admin/admin-shell';

export const metadata: Metadata = pageMetadata(
  'لوحة الإدارة',
  'إدارة منصة سند — الحجوزات، الفنيين، والإعدادات.',
);

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getServerAuthSession();

  return (
    <AuthBootstrap initialUser={user} initialProfile={profile}>
      <AdminShell>{children}</AdminShell>
    </AuthBootstrap>
  );
}

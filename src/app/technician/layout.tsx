import { AuthGuard } from '@/components/shared/auth-guard';
import { Header } from '@/components/shared/header';
import { DashboardSessionManager } from '@/components/shared/dashboard-session-manager';

const technicianNavItems = [
  { label: 'Jobs', href: '/technician/jobs' },
  { label: 'Chat', href: '/technician/chat' },
  { label: 'Profile', href: '/technician/profile' },
];

export default function TechnicianLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['technician']}>
      <DashboardSessionManager />
      <div className="flex min-h-screen flex-col">
        <Header navItems={technicianNavItems} />
        <main className="flex-1">{children}</main>
      </div>
    </AuthGuard>
  );
}

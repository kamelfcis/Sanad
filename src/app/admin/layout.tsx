'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthGuard } from '@/components/shared/auth-guard';
import { UserNav } from '@/components/shared/user-nav';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { cn } from '@/lib/utils/cn';
import {
  LayoutDashboard, ClipboardList, Users, Wrench, FolderTree, UserCog,
  Star, History, Settings, Menu, X, ChevronLeft, ChevronRight, Banknote, Images,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardSessionManager } from '@/components/shared/dashboard-session-manager';

const sidebarItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Bookings', href: '/admin/bookings', icon: ClipboardList },
  { label: 'Technicians', href: '/admin/technicians', icon: Users },
  { label: 'Customers', href: '/admin/customers', icon: UserCog },
  { label: 'Services', href: '/admin/services', icon: Wrench },
  { label: 'Categories', href: '/admin/categories', icon: FolderTree },
  { label: 'Hero Slides', href: '/admin/hero-slides', icon: Images },
  { label: 'Reviews', href: '/admin/reviews', icon: Star },
  { label: 'Payments', href: '/admin/payments', icon: Banknote },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: History },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AuthGuard allowedRoles={['admin']}>
      <DashboardSessionManager />
      <div className="flex min-h-screen bg-[#F8FAFC]">
        {mobileOpen && <div className="fixed inset-0 z-40 bg-black/20 lg:hidden" onClick={() => setMobileOpen(false)} />}

        <aside
          className={cn(
            'fixed inset-y-0 right-0 z-50 flex flex-col border-l border-[#E2E8F0] bg-white transition-all duration-200 lg:static',
            collapsed ? 'w-16' : 'w-60',
            mobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0',
          )}
        >
          <div className="flex h-14 items-center border-b border-[#E2E8F0] px-4">
            <Link href="/admin" className="flex items-center gap-2 font-semibold">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF6B00] to-[#FF8A34]">
                <Wrench className="h-4 w-4 text-white" />
              </div>
              {!collapsed && <span className="truncate text-[#0F172A]">Sanad Admin</span>}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="mr-auto hidden text-[#64748B] hover:text-[#0F172A] lg:flex"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-2">
            {sidebarItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  (pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/')))
                    ? 'bg-[#FF6B00]/5 text-[#FF6B00]'
                    : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]',
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            ))}
          </nav>

          <div className="border-t border-[#E2E8F0] p-2">
            <Link href="/" className={cn('flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-[#64748B] transition-colors hover:bg-[#F1F5F9] hover:text-[#0F172A]', collapsed && 'justify-center')}>
              <ChevronLeft className="h-3 w-3" />
              {!collapsed && <span>Back to site</span>}
            </Link>
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-[#E2E8F0] bg-white/80 backdrop-blur-xl px-4 lg:px-6">
            <Button variant="ghost" size="icon" className="text-[#64748B] hover:text-[#0F172A] lg:hidden" onClick={() => setMobileOpen(true)}>
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            <div className="mr-auto flex items-center gap-2">
              <NotificationBell />
              <UserNav />
            </div>
          </header>
          <main className="flex-1 text-[#0F172A]">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}

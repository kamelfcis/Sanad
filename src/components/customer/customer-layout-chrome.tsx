'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Wrench } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { isAdminCustomerFlowPreviewPath } from '@/lib/auth/customer-flow-preview';
import { Header } from '@/components/shared/header';
import { UserNav } from '@/components/shared/user-nav';
import { DashboardNotificationProvider } from '@/components/layout/dashboard-notification-provider';

const customerNavItems = [
  { label: 'الخدمات', href: '/customer/services' },
  { label: 'حجوزاتي', href: '/customer/bookings' },
  { label: 'عروض الأسعار', href: '/customer/quotes' },
  { label: 'المحادثات', href: '/customer/chat' },
];

function AdminPreviewHeader() {
  const { user, isLoading } = useAuthStore();

  if (isLoading || !user) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E2E8F0] bg-white/80 backdrop-blur-xl dark:border-border dark:bg-[#0B1720]/80">
      <div className="container flex h-14 items-center gap-4">
        <Link
          href="/admin"
          prefetch={false}
          className="flex items-center gap-1.5 text-sm font-medium text-[#64748B] transition-colors hover:text-[#FF6B00] dark:text-muted-foreground"
        >
          <ArrowRight className="h-4 w-4" aria-hidden />
          العودة للوحة الإدارة
        </Link>

        <Link href="/" prefetch={false} className="mr-auto flex items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF6B00] to-[#FF8A34]">
            <Wrench className="h-4 w-4 text-white" />
          </div>
          <span className="text-[#0F172A] dark:text-foreground">سند</span>
        </Link>

        <UserNav />
      </div>
    </header>
  );
}

export function CustomerLayoutChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile } = useAuthStore();

  const adminPreview =
    profile?.role === 'admin' && isAdminCustomerFlowPreviewPath(pathname);

  return (
    <DashboardNotificationProvider>
      <div className="flex min-h-screen flex-col">
        {adminPreview ? <AdminPreviewHeader /> : <Header navItems={customerNavItems} disablePrefetch />}
        <main className="flex-1">{children}</main>
      </div>
    </DashboardNotificationProvider>
  );
}

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthGuard } from '@/components/shared/auth-guard';
import { UserNav } from '@/components/shared/user-nav';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { AdminLanguageToggle } from '@/components/admin/admin-language-toggle';
import { AdminI18nProvider, useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { cn } from '@/lib/utils/cn';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Wrench,
  FolderTree,
  UserCog,
  Star,
  History,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Banknote,
  Images,
  Search,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardSessionManager } from '@/components/shared/dashboard-session-manager';

type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
};

function useAdminPageTitle() {
  const pathname = usePathname();
  const { t } = useAdminT();

  return useMemo(() => {
    if (pathname === '/admin') return t('nav.dashboard');
    if (pathname.startsWith('/admin/bookings')) return t('nav.bookings');
    if (pathname.startsWith('/admin/technicians')) return t('nav.technicians');
    if (pathname.startsWith('/admin/customers')) return t('nav.customers');
    if (pathname.startsWith('/admin/services')) return t('nav.services');
    if (pathname.startsWith('/admin/categories')) return t('nav.categories');
    if (pathname.startsWith('/admin/hero-slides')) return t('nav.heroSlides');
    if (pathname.startsWith('/admin/reviews')) return t('nav.reviews');
    if (pathname.startsWith('/admin/payments')) return t('nav.payments');
    if (pathname.startsWith('/admin/audit-logs')) return t('nav.auditLogs');
    if (pathname.startsWith('/admin/settings')) return t('nav.settings');
    return t('nav.dashboard');
  }, [pathname, t]);
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageTitle = useAdminPageTitle();
  const { t, dir } = useAdminT();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isRtl = dir === 'rtl';

  const navSections: { title: string; items: NavItem[] }[] = [
    {
      title: t('nav.sections.overview'),
      items: [{ label: t('nav.dashboard'), href: '/admin', icon: LayoutDashboard }],
    },
    {
      title: t('nav.sections.operations'),
      items: [
        { label: t('nav.bookings'), href: '/admin/bookings', icon: ClipboardList },
        { label: t('nav.technicians'), href: '/admin/technicians', icon: Users },
        { label: t('nav.customers'), href: '/admin/customers', icon: UserCog },
        { label: t('nav.payments'), href: '/admin/payments', icon: Banknote },
        { label: t('nav.reviews'), href: '/admin/reviews', icon: Star },
      ],
    },
    {
      title: t('nav.sections.catalog'),
      items: [
        { label: t('nav.services'), href: '/admin/services', icon: Wrench },
        { label: t('nav.categories'), href: '/admin/categories', icon: FolderTree },
        { label: t('nav.heroSlides'), href: '/admin/hero-slides', icon: Images },
      ],
    },
    {
      title: t('nav.sections.system'),
      items: [
        { label: t('nav.auditLogs'), href: '/admin/audit-logs', icon: History },
        { label: t('nav.settings'), href: '/admin/settings', icon: Settings },
      ],
    },
  ];

  const isActive = (href: string) =>
    pathname === href || (href !== '/admin' && pathname.startsWith(`${href}/`));

  const CollapseIcon = collapsed
    ? isRtl
      ? ChevronLeft
      : ChevronRight
    : isRtl
      ? ChevronRight
      : ChevronLeft;

  return (
    <AuthGuard allowedRoles={['admin']}>
      <DashboardSessionManager />
      <div className="flex min-h-screen bg-[#F4F4F5]" dir={dir}>
        {mobileOpen ? (
          <div
            data-testid="admin-mobile-backdrop"
            className="fixed inset-0 z-40 bg-zinc-900/20 backdrop-blur-[1px] lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}

        <aside
          className={cn(
            'fixed inset-y-0 z-50 flex flex-col border-zinc-200/80 bg-white shadow-sm transition-all duration-300 ease-out lg:static lg:shadow-none',
            isRtl ? 'right-0 border-s' : 'left-0 border-e',
            collapsed ? 'w-[4.25rem]' : 'w-[15.5rem]',
            mobileOpen
              ? 'translate-x-0'
              : isRtl
                ? 'translate-x-full lg:translate-x-0'
                : '-translate-x-full lg:translate-x-0',
          )}
        >
          <div
            className={cn(
              'flex h-14 shrink-0 items-center border-b border-zinc-200/70',
              collapsed ? 'justify-center px-2' : 'px-4',
            )}
          >
            <Link
              href="/admin"
              className={cn(
                'flex min-w-0 items-center gap-2.5 transition-opacity hover:opacity-90',
                collapsed && 'justify-center',
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF6B00] to-[#FF8A34] shadow-sm shadow-[#FF6B00]/20">
                <Wrench className="h-4 w-4 text-white" />
              </div>
              {!collapsed ? (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold tracking-tight text-zinc-900">
                    {t('nav.brand')}
                  </p>
                  <p className="truncate text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                    {t('header.adminPanel')}
                  </p>
                </div>
              ) : null}
            </Link>
            {!collapsed ? (
              <Button
                variant="ghost"
                size="icon"
                className="ms-auto hidden h-8 w-8 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 lg:flex"
                onClick={() => setCollapsed(true)}
                aria-label={t('header.collapseSidebar')}
              >
                <CollapseIcon className="h-4 w-4" />
              </Button>
            ) : null}
          </div>

          <nav className="flex-1 space-y-5 overflow-y-auto px-2 py-4">
            {navSections.map((section) => (
              <div key={section.title}>
                {!collapsed ? (
                  <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    {section.title}
                  </p>
                ) : (
                  <div className="mb-2 border-t border-zinc-100 first:border-0 first:mb-0" />
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all',
                          collapsed && 'justify-center px-2',
                          active
                            ? 'bg-zinc-100/90 text-zinc-900'
                            : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800',
                        )}
                      >
                        {active ? (
                          <span
                            aria-hidden
                            className={cn(
                              'absolute inset-y-1.5 w-[3px] rounded-full bg-gradient-to-b from-[#FF6B00] to-[#FF8A34]',
                              isRtl ? 'right-0' : 'left-0',
                            )}
                          />
                        ) : null}
                        <item.icon
                          className={cn(
                            'h-[18px] w-[18px] shrink-0 transition-colors',
                            active ? 'text-[#FF6B00]' : 'text-zinc-400 group-hover:text-zinc-600',
                          )}
                        />
                        {!collapsed ? <span className="truncate">{item.label}</span> : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="shrink-0 space-y-1 border-t border-zinc-200/70 p-2">
            {collapsed ? (
              <Button
                variant="ghost"
                size="icon"
                className="mx-auto flex h-8 w-8 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                onClick={() => setCollapsed(false)}
                aria-label={t('header.expandSidebar')}
              >
                <CollapseIcon className="h-4 w-4" />
              </Button>
            ) : null}
            <Link
              href="/"
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-800',
                collapsed && 'justify-center px-2',
              )}
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              {!collapsed ? <span>{t('nav.backToSite')}</span> : null}
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-zinc-200/60 bg-white/75 px-4 backdrop-blur-xl lg:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 lg:hidden"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label={mobileOpen ? t('header.closeMenu') : t('header.openMenu')}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>

            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-semibold tracking-tight text-zinc-900">
                {pageTitle}
              </p>
            </div>

            <div className="hidden max-w-xs flex-1 lg:block lg:max-w-sm xl:max-w-md">
              <div className="relative">
                <Search
                  className={cn(
                    'pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400',
                    isRtl ? 'right-3' : 'left-3',
                  )}
                />
                <input
                  type="search"
                  readOnly
                  placeholder={t('header.searchPlaceholder')}
                  className={cn(
                    'h-9 w-full rounded-lg border border-zinc-200/80 bg-zinc-50/80 text-sm text-zinc-600 placeholder:text-zinc-400 transition-colors focus:border-[#FF6B00]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/10',
                    isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3',
                  )}
                />
              </div>
            </div>

            <div className="ms-auto flex items-center gap-1.5 sm:gap-2">
              <AdminLanguageToggle />
              <NotificationBell variant="admin" />
              <div className="hidden h-6 w-px bg-zinc-200 sm:block" />
              <UserNav />
            </div>
          </header>

          <main className="flex-1 text-zinc-900">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminI18nProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminI18nProvider>
  );
}

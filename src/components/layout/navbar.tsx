'use client';

import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { useAuthStore } from '@/store/auth-store';
import { NavLink } from '@/components/layout/nav-link';
import { MegaMenu } from '@/components/layout/mega-menu';
import { MobileMenu } from '@/components/layout/mobile-menu';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { UserNav } from '@/components/shared/user-nav';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { Wrench, Star, Menu, Globe } from 'lucide-react';

const navItems = [
  { label: 'الرئيسية', href: '/', hasMega: false },
  { label: 'الخدمات', href: '#services', hasMega: true },
  { label: 'كيف يعمل', href: '#how-it-works', hasMega: false },
  { label: 'الفنيين', href: '/technician', hasMega: false },
  { label: 'التقييمات', href: '#reviews', hasMega: false },
  { label: 'الأسئلة الشائعة', href: '#faq', hasMega: false },
  { label: 'تواصل معنا', href: '#contact', hasMega: false },
];

function subscribeToHash(onStoreChange: () => void) {
  window.addEventListener('hashchange', onStoreChange);
  return () => window.removeEventListener('hashchange', onStoreChange);
}

function getHashSnapshot() {
  return window.location.hash;
}

function getServerHashSnapshot() {
  return '';
}

export function Navbar() {
  const pathname = usePathname();
  const { user, isLoading } = useAuthStore();
  const isLoggedIn = Boolean(user);
  const [scrolled, setScrolled] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const hash = useSyncExternalStore(subscribeToHash, getHashSnapshot, getServerHashSnapshot);
  const megaTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleMegaEnter = () => {
    if (megaTimeoutRef.current) clearTimeout(megaTimeoutRef.current);
    setMegaMenuOpen(true);
  };

  const handleMegaLeave = () => {
    megaTimeoutRef.current = setTimeout(() => setMegaMenuOpen(false), 120);
  };

  const isActive = (href: string) => {
    if (href.startsWith('#')) return hash === href;
    return pathname === href;
  };

  const bookHref = isLoggedIn ? '/customer/bookings/new' : '/auth/register';

  return (
    <>
      <header
        ref={headerRef}
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-300',
          scrolled
            ? 'border-b border-border bg-background/80 shadow-sm backdrop-blur-xl'
            : 'bg-transparent',
        )}
      >
        <div
          className={cn(
            'mx-auto grid w-full max-w-[1400px] grid-cols-[auto_1fr] items-center gap-x-3 px-4 transition-all duration-300 sm:gap-x-4 md:px-6 lg:px-8 2xl:grid-cols-[auto_minmax(0,1fr)_auto]',
            'h-16 md:h-[72px] lg:h-20',
          )}
        >
          {/* Logo — start column (right in RTL) */}
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2 transition-transform duration-200 hover:scale-[1.03] sm:gap-2.5"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-sm transition-shadow duration-200 group-hover:shadow-md group-hover:shadow-primary/20 lg:h-10 lg:w-10">
              <Wrench className="h-[18px] w-[18px] text-primary-foreground lg:h-5 lg:w-5" />
            </div>
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-lg font-bold text-text-primary -mb-0.5 lg:text-xl">سند</span>
              <span className="text-[9px] font-bold tracking-[0.25em] text-text-muted lg:text-[10px]">SANAD</span>
            </div>
          </Link>

          {/* Desktop navigation — center column, 2xl+ only (hamburger below) */}
          <nav
            aria-label="التنقل الرئيسي"
            className="hidden items-center justify-center px-2 2xl:flex"
          >
            <div className="flex items-center justify-center gap-x-4">
              {navItems.map((item) => (
                <div
                  key={item.href}
                  className={cn('shrink-0', item.hasMega && 'relative')}
                  onMouseEnter={item.hasMega ? handleMegaEnter : undefined}
                  onMouseLeave={item.hasMega ? handleMegaLeave : undefined}
                >
                  <NavLink href={item.href} isActive={isActive(item.href)}>
                    {item.label}
                  </NavLink>
                  {item.hasMega && (
                    <div onMouseEnter={handleMegaEnter} onMouseLeave={handleMegaLeave}>
                      <MegaMenu isOpen={megaMenuOpen} onClose={() => setMegaMenuOpen(false)} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </nav>

          {/* Actions — end column (left in RTL) */}
          <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-1.5 md:gap-2">
            <button
              type="button"
              aria-label="تغيير اللغة إلى الإنجليزية"
              className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-2 text-sm font-semibold text-text-secondary transition-all duration-200 hover:bg-muted hover:text-text-primary md:px-3"
            >
              <Globe className="h-4 w-4 shrink-0" aria-hidden />
              <span className="hidden sm:inline">EN</span>
            </button>

            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            {isLoggedIn && (
              <div className="hidden sm:block">
                <NotificationBell variant="light" />
              </div>
            )}

            {isLoggedIn && <UserNav size="sm" showLogoutLabel />}

            {!isLoggedIn && !isLoading && (
              <div className="hidden items-center gap-1 lg:flex lg:gap-2">
                <Link href="/auth/login">
                  <Button
                    variant="ghost"
                    className="shrink-0 px-2 font-semibold text-text-secondary hover:bg-muted hover:text-primary lg:px-4"
                  >
                    تسجيل الدخول
                  </Button>
                </Link>
                <Link href="/auth/register" className="hidden lg:block">
                  <Button
                    variant="outline"
                    className="shrink-0 whitespace-nowrap border-border font-semibold text-text-primary hover:bg-muted"
                  >
                    إنشاء حساب
                  </Button>
                </Link>
              </div>
            )}

            <Link href={bookHref}>
              <Button className="relative h-9 shrink-0 overflow-hidden bg-gradient-to-br from-primary to-accent px-3 text-sm font-bold text-primary-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/20 active:scale-[0.97] sm:px-4 md:h-10 md:px-5">
                <span className="whitespace-nowrap">احجز خدمة</span>
              </Button>
            </Link>

            <div className="hidden shrink-0 items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 min-[1400px]:flex">
              <Star className="h-3.5 w-3.5 shrink-0 fill-warning text-warning" />
              <span className="whitespace-nowrap text-xs font-bold text-text-secondary">
                4.9
                <span className="font-medium text-text-muted"> (2k+)</span>
              </span>
            </div>

            <button
              type="button"
              aria-label="فتح القائمة"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-secondary transition-all duration-200 hover:bg-muted hover:text-text-primary 2xl:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}

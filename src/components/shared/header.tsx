'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { UserNav } from '@/components/shared/user-nav';
import { cn } from '@/lib/utils/cn';
import { Wrench } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/notification-bell';

interface NavItem {
  label: string;
  href: string;
}

interface HeaderProps {
  navItems?: NavItem[];
}

export function Header({ navItems }: HeaderProps) {
  const pathname = usePathname();
  const { user, profile, isLoading } = useAuthStore();

  if (isLoading || !user) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E2E8F0] bg-white/80 backdrop-blur-xl">
      <div className="container flex h-14 items-center">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF6B00] to-[#FF8A34]">
            <Wrench className="h-4 w-4 text-white" />
          </div>
          <span className="text-[#0F172A]">سند</span>
          <span className="hidden text-xs text-[#94A3B8] sm:inline">Sanad</span>
        </Link>

        {navItems && navItems.length > 0 && (
          <nav className="mr-8 hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-[#FF6B00]',
                  pathname === item.href || pathname.startsWith(item.href + '/')
                    ? 'text-[#0F172A]'
                    : 'text-[#64748B]',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="mr-auto flex items-center gap-2">
          <NotificationBell />
          <UserNav />
        </div>
      </div>
    </header>
  );
}

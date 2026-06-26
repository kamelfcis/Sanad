'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  X,
  Zap,
  Wrench,
  Wind,
  Hammer,
  PaintBucket,
  Home,
  LogIn,
  UserPlus,
  Globe,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { useAuthStore } from '@/store/auth-store';
import { getDisplayEmail, getDisplayName } from '@/lib/auth/display-user';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { UserNav } from '@/components/shared/user-nav';

const categories = [
  { icon: Zap, name: 'كهرباء', href: '/services?specialty=electrical', color: '#FF6B00' },
  { icon: Wrench, name: 'سباكة', href: '/services?specialty=plumbing', color: '#194E5B' },
  { icon: Wind, name: 'تكييف', href: '/services?specialty=ac-repair', color: '#FF8A34' },
  { icon: Hammer, name: 'نجارة', href: '/services?specialty=carpentry', color: '#10B981' },
  { icon: PaintBucket, name: 'دهان', href: '/services?specialty=painting', color: '#8B5CF6' },
  { icon: Home, name: 'صيانة منزلية', href: '/services?specialty=general-maintenance', color: '#EF4444' },
];

const links = [
  { label: 'الرئيسية', href: '/' },
  { label: 'الخدمات', href: '#services' },
  { label: 'كيف يعمل', href: '#how-it-works' },
  { label: 'الفنيين', href: '/technician' },
  { label: 'التقييمات', href: '#reviews' },
  { label: 'الأسئلة الشائعة', href: '#faq' },
  { label: 'تواصل معنا', href: '#contact' },
];

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const { user, profile, isLoading } = useAuthStore();
  const isLoggedIn = Boolean(user);

  const displayName = getDisplayName(user, profile);
  const displayEmail = getDisplayEmail(user, profile);

  const bookHref = isLoggedIn ? '/customer/bookings/new' : '/auth/register';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm 2xl:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-r border-border bg-background shadow-2xl 2xl:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="قائمة التنقل"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <Link href="/" onClick={onClose} className="flex shrink-0 items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-sm">
                  <Wrench className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-base font-bold text-text-primary -mb-0.5">سند</span>
                  <span className="text-[9px] font-semibold tracking-[0.2em] text-text-muted">SANAD</span>
                </div>
              </Link>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  aria-label="تغيير اللغة إلى الإنجليزية"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-muted hover:text-text-primary"
                >
                  <Globe className="h-4 w-4" />
                </button>
                <ThemeToggle />
                <button
                  type="button"
                  aria-label="إغلاق القائمة"
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-muted hover:text-text-primary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="border-b border-border px-5 py-4">
              {isLoggedIn ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1 text-right">
                    <p className="truncate text-sm font-bold text-text-primary">
                      {displayName ?? 'مستخدم'}
                    </p>
                    {displayEmail && (
                      <p className="truncate text-xs text-text-muted">{displayEmail}</p>
                    )}
                  </div>
                  <UserNav size="sm" />
                </div>
              ) : !isLoading ? (
                <div className="flex flex-col gap-2">
                  <Link href="/auth/login" onClick={onClose}>
                    <Button
                      variant="outline"
                      className="h-11 w-full justify-center gap-2 border-border font-semibold text-text-primary hover:bg-muted"
                    >
                      <LogIn className="h-4 w-4" />
                      تسجيل الدخول
                    </Button>
                  </Link>
                  <Link href="/auth/register" onClick={onClose}>
                    <Button
                      variant="ghost"
                      className="h-11 w-full justify-center gap-2 font-semibold text-text-secondary hover:bg-muted hover:text-primary"
                    >
                      <UserPlus className="h-4 w-4" />
                      إنشاء حساب
                    </Button>
                  </Link>
                </div>
              ) : null}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <nav aria-label="روابط الصفحة" className="space-y-0.5">
                {links.map((link) => {
                  const active =
                    link.href.startsWith('#')
                      ? false
                      : pathname === link.href;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={onClose}
                      className={cn(
                        'block rounded-xl px-4 py-3.5 text-base font-bold transition-colors hover:bg-muted hover:text-primary',
                        active ? 'bg-muted text-primary' : 'text-text-primary',
                      )}
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-8">
                <h3 className="mb-3 px-4 text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted">
                  الخدمات
                </h3>
                <div className="space-y-0.5">
                  {categories.map((cat) => (
                    <Link
                      key={cat.name}
                      href={cat.href}
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-xl px-4 py-3.5 transition-colors hover:bg-muted"
                    >
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${cat.color}12` }}
                      >
                        <cat.icon className="h-4 w-4" style={{ color: cat.color }} />
                      </div>
                      <span className="text-sm font-semibold text-text-primary">{cat.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t border-border px-5 py-4">
              <div className="flex items-center justify-center gap-1.5 rounded-lg bg-muted px-3 py-2">
                <Star className="h-3.5 w-3.5 shrink-0 fill-warning text-warning" />
                <span className="text-xs font-bold text-text-secondary">
                  4.9
                  <span className="font-medium text-text-muted"> (2k+ تقييم)</span>
                </span>
              </div>
              <Link href={bookHref} onClick={onClose}>
                <Button className="h-12 w-full bg-gradient-to-br from-primary to-accent text-base font-bold text-primary-foreground shadow-sm transition-all duration-200 hover:shadow-md hover:shadow-primary/20 active:scale-[0.98]">
                  احجز خدمة
                </Button>
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

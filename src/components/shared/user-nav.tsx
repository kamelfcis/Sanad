'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import {
  getAvatarUrl,
  getDisplayEmail,
  getDisplayName,
  getInitials,
} from '@/lib/auth/display-user';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogoutModal } from '@/components/auth/logout-modal';
import { useAdminI18nOptional } from '@/lib/i18n/admin/use-admin-t';
import {
  LogOut,
  User,
  Settings,
  Shield,
  Bell,
  LayoutDashboard,
  Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface UserNavProps {
  size?: 'sm' | 'default';
  showLogoutLabel?: boolean;
}

export function UserNav({ size = 'default', showLogoutLabel = false }: UserNavProps) {
  const { user, profile } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const adminI18n = useAdminI18nOptional();
  const isAdminContext = pathname.startsWith('/admin') && !!adminI18n;
  const [logoutOpen, setLogoutOpen] = useState(false);

  const displayName = getDisplayName(user, profile);
  const displayEmail = getDisplayEmail(user, profile);
  const avatarUrl = getAvatarUrl(user, profile);
  const initials = getInitials(displayName, displayEmail);

  const avatarSize =
    size === 'sm' ? 'h-8 w-8 sm:h-9 sm:w-9' : 'h-9 w-9';

  const profileLink =
    profile?.role === 'customer'
      ? '/customer/bookings'
      : profile?.role === 'technician'
        ? '/technician/profile'
        : '/admin';

  const dashboardLink =
    profile?.role === 'customer'
      ? '/services'
      : profile?.role === 'technician'
        ? '/technician/jobs'
        : '/admin';

  const settingsLink =
    profile?.role === 'admin' ? '/admin/settings' : '/settings/security';

  const labels = isAdminContext
    ? {
        menuAria: adminI18n.t('userNav.menuAria'),
        defaultName: adminI18n.t('userNav.defaultName'),
        dashboard: adminI18n.t('userNav.dashboard'),
        profile: adminI18n.t('userNav.profile'),
        settings: adminI18n.t('userNav.settings'),
        security: adminI18n.t('userNav.security'),
        notifications: adminI18n.t('userNav.notifications'),
        myJobs: adminI18n.t('userNav.myJobs'),
        logout: adminI18n.t('userNav.logout'),
      }
    : {
        menuAria: 'قائمة المستخدم',
        defaultName: 'مستخدم',
        dashboard: 'لوحة التحكم',
        profile: 'الملف الشخصي',
        settings: 'الإعدادات',
        security: 'الأمان',
        notifications: 'الإشعارات',
        myJobs: 'مهامي',
        logout: 'تسجيل الخروج',
      };

  const menuAlign = isAdminContext && adminI18n.dir === 'ltr' ? 'end' : 'end';
  const textAlign = isAdminContext && adminI18n.dir === 'ltr' ? 'text-left' : 'text-right';
  const iconMargin = isAdminContext && adminI18n.dir === 'ltr' ? 'mr-2' : 'ml-2';

  return (
    <>
      <div className="flex shrink-0 items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn('relative rounded-full p-0', avatarSize)}
              aria-label={labels.menuAria}
            >
              <Avatar className={avatarSize}>
                <AvatarImage src={avatarUrl} alt={displayName ?? ''} />
                <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align={menuAlign} forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className={cn('flex flex-col space-y-1', textAlign)}>
                <p className="text-sm font-medium leading-none">{displayName ?? labels.defaultName}</p>
                {displayEmail && (
                  <p className="text-xs leading-none text-muted-foreground">{displayEmail}</p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push(dashboardLink)}>
                <LayoutDashboard className={cn('h-4 w-4', iconMargin)} />
                {labels.dashboard}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(profileLink)}>
                <User className={cn('h-4 w-4', iconMargin)} />
                {labels.profile}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(settingsLink)}>
                <Settings className={cn('h-4 w-4', iconMargin)} />
                {labels.settings}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings/security')}>
                <Shield className={cn('h-4 w-4', iconMargin)} />
                {labels.security}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/notifications')}>
                <Bell className={cn('h-4 w-4', iconMargin)} />
                {labels.notifications}
              </DropdownMenuItem>
              {profile?.role === 'technician' && (
                <DropdownMenuItem onClick={() => router.push('/technician/jobs')}>
                  <Briefcase className={cn('h-4 w-4', iconMargin)} />
                  {labels.myJobs}
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setLogoutOpen(true)}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <LogOut className={cn('h-4 w-4', iconMargin)} />
              {labels.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {showLogoutLabel && (
          <Button
            variant="ghost"
            size="sm"
            className="hidden shrink-0 px-2 font-semibold text-text-secondary hover:bg-muted hover:text-destructive lg:inline-flex"
            onClick={() => setLogoutOpen(true)}
          >
            {labels.logout}
          </Button>
        )}
      </div>

      <LogoutModal open={logoutOpen} onOpenChange={setLogoutOpen} scope="local" />
    </>
  );
}

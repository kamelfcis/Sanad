'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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

  return (
    <>
      <div className="flex shrink-0 items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn('relative rounded-full p-0', avatarSize)}
              aria-label="قائمة المستخدم"
            >
              <Avatar className={avatarSize}>
                <AvatarImage src={avatarUrl} alt={displayName ?? ''} />
                <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1 text-right">
                <p className="text-sm font-medium leading-none">{displayName ?? 'مستخدم'}</p>
                {displayEmail && (
                  <p className="text-xs leading-none text-muted-foreground">{displayEmail}</p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push(dashboardLink)}>
                <LayoutDashboard className="ml-2 h-4 w-4" />
                لوحة التحكم
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(profileLink)}>
                <User className="ml-2 h-4 w-4" />
                الملف الشخصي
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(settingsLink)}>
                <Settings className="ml-2 h-4 w-4" />
                الإعدادات
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings/security')}>
                <Shield className="ml-2 h-4 w-4" />
                الأمان
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/notifications')}>
                <Bell className="ml-2 h-4 w-4" />
                الإشعارات
              </DropdownMenuItem>
              {profile?.role === 'technician' && (
                <DropdownMenuItem onClick={() => router.push('/technician/jobs')}>
                  <Briefcase className="ml-2 h-4 w-4" />
                  مهامي
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setLogoutOpen(true)}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <LogOut className="ml-2 h-4 w-4" />
              تسجيل الخروج
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
            تسجيل الخروج
          </Button>
        )}
      </div>

      <LogoutModal open={logoutOpen} onOpenChange={setLogoutOpen} scope="local" />
    </>
  );
}

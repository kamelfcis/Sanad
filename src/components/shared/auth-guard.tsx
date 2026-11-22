'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { buildLoginHrefWithNext } from '@/lib/auth/safe-redirect';
import { isAdminCustomerFlowPreviewPath } from '@/lib/auth/customer-flow-preview';
import { PageLoading } from '@/components/shared/page-loading';

type Role = 'customer' | 'technician' | 'admin';

function roleMayAccess(
  role: Role | undefined,
  allowedRoles: Role[],
  pathname: string,
): boolean {
  if (!role) return false;
  if (allowedRoles.includes(role)) return true;
  return role === 'admin' && isAdminCustomerFlowPreviewPath(pathname);
}

export function AuthGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: Role[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, isLoading, sessionResolved } = useAuthStore();
  const accessGranted = useMemo(
    () => roleMayAccess(profile?.role, allowedRoles, pathname),
    [profile?.role, allowedRoles, pathname],
  );

  useEffect(() => {
    if (isLoading) return;

    let cancelled = false;

    const redirectUnauthenticated = () => {
      const state = useAuthStore.getState();
      if (state.isLoading || state.user) return;
      const returnPath = `${window.location.pathname}${window.location.search}`;
      router.replace(buildLoginHrefWithNext(returnPath));
    };

    if (!user) {
      const timer = window.setTimeout(() => {
        if (!cancelled) redirectUnauthenticated();
      }, 300);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }

    if (!profile) {
      router.replace('/auth/role-selection');
      return;
    }

    if (!roleMayAccess(profile.role, allowedRoles, pathname)) {
      const redirectMap: Record<string, string> = {
        customer: '/services',
        technician: '/technician/jobs',
        admin: '/admin',
      };
      router.replace(redirectMap[profile.role] ?? '/');
    }
  }, [user, profile, isLoading, allowedRoles, router, pathname]);

  if (!sessionResolved || isLoading) {
    return <PageLoading />;
  }

  if (!user || !profile || !accessGranted) {
    return <PageLoading />;
  }

  return <>{children}</>;
}

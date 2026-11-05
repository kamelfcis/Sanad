'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { buildLoginHrefWithNext } from '@/lib/auth/safe-redirect';
import { PageLoading } from '@/components/shared/page-loading';

type Role = 'customer' | 'technician' | 'admin';

export function AuthGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: Role[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, profile, isLoading, sessionResolved } = useAuthStore();

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

    if (!allowedRoles.includes(profile.role)) {
      const redirectMap: Record<string, string> = {
        customer: '/services',
        technician: '/technician/jobs',
        admin: '/admin',
      };
      router.replace(redirectMap[profile.role] ?? '/');
    }
  }, [user, profile, isLoading, allowedRoles, router]);

  if (!sessionResolved || isLoading) {
    return <PageLoading />;
  }

  if (!user || !profile || !allowedRoles.includes(profile.role)) {
    return <PageLoading />;
  }

  return <>{children}</>;
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { buildLoginHrefWithNext } from '@/lib/auth/safe-redirect';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';
import { PageLoading } from '@/components/shared/page-loading';

type AllowedRole = 'customer' | 'technician' | 'admin';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles: AllowedRole[];
  fallbackPath?: string;
}

function AuthGuardLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <PageLoading />
    </div>
  );
}

async function fetchProfile(userId: string) {
  const supabase = createClient();
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  return data ?? null;
}

export function AuthGuard({ children, allowedRoles, fallbackPath = '/auth/login' }: AuthGuardProps) {
  const { user, profile, isLoading, sessionResolved, setUser, setProfile } = useAuthStore();
  const router = useRouter();
  const rolesKey = allowedRoles.join(',');

  useEffect(() => {
    if (!sessionResolved) return;

    let cancelled = false;

    const resolveAccess = async () => {
      let activeUser = user;
      let activeProfile = profile;

      if (!activeUser || !activeProfile) {
        const supabase = createClient();
        if (!activeUser) {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            activeUser = authUser;
            setUser(authUser);
          }
        }
        if (activeUser && !activeProfile) {
          activeProfile = await fetchProfile(activeUser.id);
          if (activeProfile) setProfile(activeProfile);
        }
      }

      if (cancelled) return;

      if (!activeUser) {
        const returnPath = `${window.location.pathname}${window.location.search}`;
        router.replace(buildLoginHrefWithNext(returnPath));
        return;
      }

      if (!activeProfile) {
        router.replace('/auth/role-selection');
        return;
      }

      if (!allowedRoles.includes(activeProfile.role)) {
        const redirectMap: Record<string, string> = {
          customer: '/services',
          technician: '/technician/jobs',
          admin: '/admin',
        };
        router.replace(redirectMap[activeProfile.role] ?? fallbackPath);
      }
    };

    void resolveAccess();

    return () => {
      cancelled = true;
    };
  }, [user, profile, sessionResolved, rolesKey, fallbackPath, router, setUser, setProfile]);

  if (!sessionResolved || isLoading || !user || !profile) {
    return <AuthGuardLoading />;
  }

  if (!allowedRoles.includes(profile.role)) {
    return <AuthGuardLoading />;
  }

  return <>{children}</>;
}

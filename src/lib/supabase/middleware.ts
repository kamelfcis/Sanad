import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getTechnicianProfileMissingFields } from '@/lib/technician/profile-complete';
import { getSafeInternalRedirect, redirectUrlForPath } from '@/lib/auth/safe-redirect';

/** Strip spoofed client identity; set trusted user id for downstream rate limiting */
function createForwardResponse(request: NextRequest, userId?: string) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete('x-user-id');
  if (userId) {
    requestHeaders.set('x-user-id', userId);
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

async function getTechnicianOnboardingStatus(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
) {
  const { data: tp } = await supabase
    .from('technician_profiles')
    .select('national_id, governorate, bio, profile_photo_url, id_card_photo_url')
    .eq('id', userId)
    .maybeSingle();

  const { count } = await supabase
    .from('technician_skills')
    .select('*', { count: 'exact', head: true })
    .eq('technician_id', userId);

  const skillsCount = count ?? 0;
  const missing = getTechnicianProfileMissingFields(tp, skillsCount);

  return {
    complete: missing.length === 0,
    missing,
    profile: tp,
    skillsCount,
  };
}

/** Routes an incomplete technician may use to fix soft gaps (e.g. bio cleared by a bad update). */
function canAccessTechnicianRouteWhileIncomplete(pathname: string, missing: string[]) {
  if (missing.length === 0) return true;
  const hardFields = ['national_id', 'governorate', 'profile_photo_url', 'id_card_photo_url'];
  const hasHardGap = missing.some((field) => hardFields.includes(field));
  if (hasHardGap) return false;
  return pathname === '/technician/profile';
}

function technicianHomePath(complete: boolean) {
  return complete ? '/technician/jobs' : '/auth/register-technician?complete=1';
}

export async function updateSession(request: NextRequest) {
  let trustedUserId: string | undefined;
  let supabaseResponse = createForwardResponse(request);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = createForwardResponse(request, trustedUserId);
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    trustedUserId = user.id;
    const refreshed = createForwardResponse(request, trustedUserId);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      refreshed.cookies.set(cookie.name, cookie.value);
    });
    supabaseResponse = refreshed;
  }

  const pathname = request.nextUrl.pathname;
  const isApiRoute = pathname.startsWith('/api/');

  // Recover from query string embedded in pathname (e.g. /auth/register-technician%3Fcomplete=1)
  if (pathname.startsWith('/auth/register-technician') && pathname !== '/auth/register-technician') {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/register-technician';
    const suffix = decodeURIComponent(pathname.slice('/auth/register-technician'.length));
    const query = suffix.replace(/^\?/, '');
    url.search = query ? `?${query}` : '';
    return NextResponse.redirect(url);
  }

  const isCompleteRegistration =
    pathname === '/auth/register-technician' && request.nextUrl.searchParams.get('complete') === '1';

  // Legacy alias — public browse lives at /services (no AuthGuard)
  if (pathname === '/customer/services') {
    const url = request.nextUrl.clone();
    url.pathname = '/services';
    return NextResponse.redirect(url);
  }

  const isAuthRoute = pathname.startsWith('/auth');
  const isCustomerRoute = pathname.startsWith('/customer');
  const isTechnicianRoute = pathname.startsWith('/technician');
  const isAdminRoute = pathname.startsWith('/admin');
  const isSettingsRoute = pathname.startsWith('/settings');
  const isNotificationsRoute = pathname.startsWith('/notifications');
  const isProtectedRoute =
    isCustomerRoute || isTechnicianRoute || isAdminRoute || isSettingsRoute || isNotificationsRoute;

  if (isAuthRoute && user) {
    if (isCompleteRegistration) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile && profile.role !== 'technician') {
        const url = request.nextUrl.clone();
        url.pathname = profile.role === 'admin' ? '/admin' : '/services';
        url.search = '';
        return NextResponse.redirect(url);
      }

      return supabaseResponse;
    }

    const nextPath = getSafeInternalRedirect(request.nextUrl.searchParams.get('next'));
    if (nextPath) {
      return NextResponse.redirect(redirectUrlForPath(nextPath, request.url));
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const url = request.nextUrl.clone();
    if (!profile) {
      url.pathname = '/auth/role-selection';
    } else if (profile.role === 'technician') {
      const { complete } = await getTechnicianOnboardingStatus(supabase, user.id);
      return NextResponse.redirect(redirectUrlForPath(technicianHomePath(complete), request.url));
    } else if (profile.role === 'admin') {
      url.pathname = '/admin';
    } else {
      url.pathname = '/services';
    }
    return NextResponse.redirect(url);
  }

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  if (!user && isCompleteRegistration) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/register-technician';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (isCustomerRoute && profile?.role !== 'customer') {
      const url = request.nextUrl.clone();
      if (profile) {
        url.pathname = '/auth/login';
        url.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
      } else {
        url.pathname = '/auth/role-selection';
      }
      return NextResponse.redirect(url);
    }

    if (isTechnicianRoute && profile?.role !== 'technician') {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      return NextResponse.redirect(url);
    }

    if (isAdminRoute && profile?.role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      return NextResponse.redirect(url);
    }

    if (profile?.role === 'technician') {
      const { complete, missing } = await getTechnicianOnboardingStatus(supabase, user.id);
      const isSetupRoute = pathname === '/technician/setup' || isCompleteRegistration;

      if (
        !complete &&
        !isSetupRoute &&
        !isApiRoute &&
        !canAccessTechnicianRouteWhileIncomplete(pathname, missing)
      ) {
        const url = request.nextUrl.clone();
        url.pathname = '/auth/register-technician';
        url.search = 'complete=1';
        return NextResponse.redirect(url);
      }

      if (complete && (pathname === '/technician/setup' || isCompleteRegistration)) {
        const url = request.nextUrl.clone();
        url.pathname = '/technician/jobs';
        url.search = '';
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}

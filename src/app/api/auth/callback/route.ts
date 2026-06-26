import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { parseSearchParams } from '@/lib/api/validate';
import { authCallbackQuerySchema } from '@/lib/validations/auth';
import { isTechnicianProfileComplete } from '@/lib/technician/profile-complete';
import { getSafeInternalRedirect, redirectUrlForPath } from '@/lib/auth/safe-redirect';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const query = parseSearchParams(searchParams, authCallbackQuerySchema);
  if ('response' in query) return query.response;

  const { code, next = '/', role: urlRole } = query.data;

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(
            cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[],
          ) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          },
        },
      },
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();

      const profilePayload = {
        id: data.user.id,
        email: data.user.email!,
        full_name:
          data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? null,
        avatar_url: data.user.user_metadata?.avatar_url ?? null,
      };

      if (profile) {
        const safeNext = getSafeInternalRedirect(next);
        if (safeNext && safeNext !== '/') {
          return NextResponse.redirect(redirectUrlForPath(safeNext, origin));
        }

        const url = new URL(origin);

        if (profile.role === 'technician') {
          const { data: tp } = await supabase
            .from('technician_profiles')
            .select('national_id, governorate, bio, profile_photo_url, id_card_photo_url')
            .eq('id', data.user.id)
            .maybeSingle();
          const { count } = await supabase
            .from('technician_skills')
            .select('*', { count: 'exact', head: true })
            .eq('technician_id', data.user.id);
          url.pathname = isTechnicianProfileComplete(tp, count ?? 0)
            ? '/technician/jobs'
            : '/auth/register-technician?complete=1';
        } else if (profile.role === 'admin') url.pathname = '/admin';
        else url.pathname = '/services';

        return NextResponse.redirect(url);
      }

      // New OAuth user — check for role in URL param or metadata
      const role = urlRole ?? data.user.user_metadata?.role ?? null;
      if (role && ['customer', 'technician'].includes(role)) {
        await supabase.from('profiles').upsert(
          { ...profilePayload, role },
          { onConflict: 'id' },
        );

        const url = new URL(origin);
        url.pathname =
          role === 'technician' ? '/auth/register-technician?complete=1' : '/services';
        return NextResponse.redirect(url);
      }

      // No role in metadata — create basic profile and redirect to role selection
      await supabase.from('profiles').upsert(
        { ...profilePayload, role: 'customer' },
        { onConflict: 'id' },
      );

      const url = new URL(origin);
      url.pathname = '/auth/role-selection';
      return NextResponse.redirect(url);
    }
  }

  const safeNext = getSafeInternalRedirect(next);
  return NextResponse.redirect(safeNext ? redirectUrlForPath(safeNext, origin) : new URL('/', origin));
}

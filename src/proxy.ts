import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { applyRateLimit } from '@/lib/rate-limit/proxy-throttle';

export async function proxy(request: NextRequest) {
  const throttled = applyRateLimit(request);
  if (throttled) return throttled;

  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

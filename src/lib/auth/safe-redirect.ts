/** Allow only same-origin relative paths (optionally with query string). */
export function getSafeInternalRedirect(path: string | null | undefined): string | null {
  if (!path || typeof path !== 'string') return null;
  const trimmed = path.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null;
  if (trimmed.includes('://')) return null;
  return trimmed;
}

/** Login URL that returns the user to an internal path after auth. */
export function buildLoginHrefWithNext(returnPath: string): string {
  const safe = getSafeInternalRedirect(returnPath);
  if (!safe) return '/auth/login';
  return `/auth/login?next=${encodeURIComponent(safe)}`;
}

export function redirectUrlForPath(path: string, base: string | URL): URL {
  const safe = getSafeInternalRedirect(path);
  if (!safe) return new URL('/', base);
  const [pathname, search] = safe.split('?');
  const url = new URL(pathname, base);
  if (search) url.search = `?${search}`;
  return url;
}

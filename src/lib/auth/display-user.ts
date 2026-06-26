import type { User } from '@supabase/supabase-js';

type ProfileLike = {
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
} | null;

export function getDisplayName(user: User | null, profile: ProfileLike): string | null {
  return (
    profile?.full_name ??
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    user?.email?.split('@')[0] ??
    null
  );
}

export function getDisplayEmail(user: User | null, profile: ProfileLike): string | null {
  return profile?.email ?? user?.email ?? null;
}

export function getAvatarUrl(user: User | null, profile: ProfileLike): string | undefined {
  return (
    profile?.avatar_url ??
    (user?.user_metadata?.avatar_url as string | undefined) ??
    (user?.user_metadata?.picture as string | undefined) ??
    undefined
  );
}

export function getInitials(displayName: string | null, email?: string | null): string {
  if (displayName) {
    return displayName
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  if (email) {
    return email[0]?.toUpperCase() ?? '?';
  }
  return '?';
}

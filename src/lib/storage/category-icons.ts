import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';

export const CATEGORY_ICONS_BUCKET = 'category-icons';

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

export const MAX_CATEGORY_ICON_BYTES = 1024 * 1024;

export const ALLOWED_CATEGORY_ICON_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
] as const;

function getPublicUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
  }
  return `${baseUrl}/storage/v1/object/public/${CATEGORY_ICONS_BUCKET}/${path}`;
}

function generateCategoryIconPath(fileType: string): string {
  const ext = MIME_EXTENSIONS[fileType] ?? 'bin';
  return `categories/${crypto.randomUUID()}.${ext}`;
}

export function extractCategoryIconStoragePath(publicUrl: string): string | null {
  const marker = `/storage/v1/object/public/${CATEGORY_ICONS_BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return null;
  return publicUrl.slice(index + marker.length);
}

export async function generateCategoryIconUploadUrl(
  fileType: string,
): Promise<{ publicUrl: string; key: string; token: string } | null> {
  if (!isServiceRoleConfigured()) return null;

  const path = generateCategoryIconPath(fileType);
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase.storage
    .from(CATEGORY_ICONS_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) return null;

  return {
    publicUrl: getPublicUrl(path),
    key: path,
    token: data.token,
  };
}

export async function deleteCategoryIconByUrl(publicUrl: string | null | undefined): Promise<void> {
  if (!publicUrl || !isServiceRoleConfigured()) return;

  const path = extractCategoryIconStoragePath(publicUrl);
  if (!path) return;

  const supabase = createServiceRoleClient();
  await supabase.storage.from(CATEGORY_ICONS_BUCKET).remove([path]);
}

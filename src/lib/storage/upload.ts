import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { STORAGE_BUCKET } from '@/lib/storage/constants';

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

function sanitizeUserId(userId: string): string {
  return userId.replace(/[^a-zA-Z0-9-]/g, '');
}

function generatePath(userId: string, fileType: string, subfolder?: string): string {
  const ext = MIME_EXTENSIONS[fileType] ?? 'bin';
  const safeUserId = sanitizeUserId(userId);
  const id = crypto.randomUUID();
  if (subfolder === 'payments') {
    return `${safeUserId}/payments/${id}.${ext}`;
  }
  const timestamp = Date.now();
  return `${safeUserId}/${timestamp}-${id}.${ext}`;
}

function getPublicUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
  }
  return `${baseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}

export async function uploadFileForUser(
  userId: string,
  file: Blob,
  fileType: string,
  subfolder?: 'payments',
): Promise<string | null> {
  if (!isServiceRoleConfigured()) return null;

  const path = generatePath(userId, fileType, subfolder);
  const supabase = createServiceRoleClient();

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
    contentType: fileType,
    upsert: false,
  });

  if (error) return null;
  return getPublicUrl(path);
}

export async function generateUploadUrl(
  fileType: string,
  userId: string,
  subfolder?: 'payments',
): Promise<{ url: string; publicUrl: string; key: string; token: string } | null> {
  if (!isServiceRoleConfigured()) return null;

  const path = generatePath(userId, fileType, subfolder);
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) return null;

  return {
    url: data.signedUrl,
    publicUrl: getPublicUrl(path),
    key: path,
    token: data.token,
  };
}

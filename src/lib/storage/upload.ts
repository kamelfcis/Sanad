import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { STORAGE_BUCKET } from '@/lib/storage/constants';
import { logger } from '@/lib/logger';

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

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
): Promise<UploadResult> {
  if (!isServiceRoleConfigured()) {
    logger.error('uploadFileForUser: service role key not configured');
    return { ok: false, error: 'storage_not_configured' };
  }

  const path = generatePath(userId, fileType, subfolder);
  const supabase = createServiceRoleClient();

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
    contentType: fileType,
    upsert: false,
  });

  if (error) {
    logger.error('uploadFileForUser: storage upload failed', error, { path });
    return { ok: false, error: error.message };
  }

  return { ok: true, url: getPublicUrl(path) };
}

export async function generateUploadUrl(
  fileType: string,
  userId: string,
  subfolder?: 'payments',
): Promise<{ url: string; publicUrl: string; key: string; token: string } | null> {
  if (!isServiceRoleConfigured()) {
    logger.error('generateUploadUrl: service role key not configured');
    return null;
  }

  const path = generatePath(userId, fileType, subfolder);
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    logger.error('generateUploadUrl: failed to create signed upload URL', error ?? undefined, {
      path,
    });
    return null;
  }

  return {
    url: data.signedUrl,
    publicUrl: getPublicUrl(path),
    key: path,
    token: data.token,
  };
}

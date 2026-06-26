'use client';

import { createClient } from '@/lib/supabase/client';
import { STORAGE_BUCKET } from '@/lib/storage/constants';

export async function uploadFileViaApi(file: File, purpose: 'default' | 'payment' = 'default'): Promise<string> {
  const presignRes = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileType: file.type, fileSize: file.size, purpose }),
  });

  if (!presignRes.ok) {
    const err = await presignRes.json().catch(() => ({}));
    throw new Error(err.error ?? 'Failed to get upload URL');
  }

  const { publicUrl, key, token } = await presignRes.json();

  const supabase = createClient();
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .uploadToSignedUrl(key, token, file, { contentType: file.type });

  if (error) {
    throw new Error(error.message || 'Failed to upload file');
  }

  return publicUrl;
}

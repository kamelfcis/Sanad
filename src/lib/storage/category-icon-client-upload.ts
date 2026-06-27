'use client';

import { createClient } from '@/lib/supabase/client';
import { CATEGORY_ICONS_BUCKET } from '@/lib/storage/category-icons';

export async function uploadCategoryIconViaApi(file: File): Promise<string> {
  const presignRes = await fetch('/api/admin/categories/icon', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileType: file.type, fileSize: file.size }),
  });

  if (!presignRes.ok) {
    const err = await presignRes.json().catch(() => ({}));
    throw new Error(err.error ?? 'Failed to get category icon upload URL');
  }

  const { publicUrl, key, token } = await presignRes.json();

  const supabase = createClient();
  const { error } = await supabase.storage
    .from(CATEGORY_ICONS_BUCKET)
    .uploadToSignedUrl(key, token, file, { contentType: file.type });

  if (error) {
    throw new Error(error.message || 'Failed to upload category icon');
  }

  return publicUrl;
}

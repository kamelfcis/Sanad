import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth, requireAdmin } from '@/lib/api/auth';
import { parseJsonBody } from '@/lib/api/validate';
import {
  ALLOWED_CATEGORY_ICON_MIME_TYPES,
  generateCategoryIconUploadUrl,
  MAX_CATEGORY_ICON_BYTES,
} from '@/lib/storage/category-icons';

const categoryIconUploadSchema = z.object({
  fileType: z.enum(ALLOWED_CATEGORY_ICON_MIME_TYPES, {
    required_error: 'fileType is required',
    invalid_type_error: 'Invalid file type. Allowed: JPEG, PNG, WebP, SVG',
  }),
  fileSize: z
    .number()
    .int()
    .positive('fileSize must be positive')
    .max(MAX_CATEGORY_ICON_BYTES, 'File too large. Maximum size is 1MB.')
    .optional(),
});

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;

  const parsed = await parseJsonBody(request, categoryIconUploadSchema);
  if ('response' in parsed) return parsed.response;

  const result = await generateCategoryIconUploadUrl(parsed.data.fileType);
  if (!result) {
    return NextResponse.json(
      { error: 'Category icon upload is not configured. Please contact support.' },
      { status: 503 },
    );
  }

  return NextResponse.json(result);
}

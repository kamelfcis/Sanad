import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { parseJsonBody } from '@/lib/api/validate';
import { generateUploadUrl } from '@/lib/storage/upload';
import { uploadRequestSchema } from '@/lib/validations/upload';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const parsed = await parseJsonBody(request, uploadRequestSchema);
  if ('response' in parsed) return parsed.response;

  const { fileType, fileSize, purpose } = parsed.data;

  if (fileSize !== undefined && fileSize <= 0) {
    return NextResponse.json({ error: 'Invalid file size' }, { status: 400 });
  }

  const subfolder = purpose === 'payment' ? 'payments' : undefined;
  const result = await generateUploadUrl(fileType, auth.user.id, subfolder);

  if (!result) {
    return NextResponse.json(
      { error: 'File upload is not configured. Please contact support.' },
      { status: 503 },
    );
  }

  return NextResponse.json(result);
}

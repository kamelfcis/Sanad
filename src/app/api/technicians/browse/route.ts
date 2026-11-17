import { NextRequest, NextResponse } from 'next/server';
import { isServiceRoleConfigured } from '@/lib/supabase/admin';
import { parseSearchParams } from '@/lib/api/validate';
import { browseTechniciansQuerySchema } from '@/lib/validations/technicians';
import { listBrowseTechnicians } from '@/lib/technicians/browse-query';

export async function GET(request: NextRequest) {
  const query = parseSearchParams(request.nextUrl.searchParams, browseTechniciansQuerySchema);
  if ('response' in query) return query.response;

  if (!isServiceRoleConfigured()) {
    return NextResponse.json(
      { error: 'خدمة البحث غير متاحة حالياً. يرجى المحاولة لاحقاً.' },
      { status: 503 },
    );
  }

  try {
    const result = await listBrowseTechnicians(query.data);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'browse_failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

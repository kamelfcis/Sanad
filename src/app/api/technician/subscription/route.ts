import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/api/auth';
import {
  PROVIDER_SUBSCRIPTION_AMOUNT_EGP,
  PROVIDER_SUBSCRIPTION_RECEIPT_MAX_BYTES,
  PROVIDER_SUBSCRIPTION_RECEIPT_MIME_TYPES,
  PROVIDER_SUBSCRIPTION_RECEIPTS_BUCKET,
} from '@/lib/constants/provider-subscription';

const fileExtensionByMime: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

async function getProvider() {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return { response: auth.response } as const;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', auth.user.id)
    .maybeSingle();
  if (profileError) {
    return { response: NextResponse.json({ error: 'تعذر التحقق من الحساب.' }, { status: 500 }) } as const;
  }
  if (profile?.role !== 'technician') {
    return { response: NextResponse.json({ error: 'الخدمة مخصصة لمقدمي الخدمات.' }, { status: 403 }) } as const;
  }

  const { data: technician, error: technicianError } = await supabase
    .from('technician_profiles')
    .select('id, verification_status')
    .eq('id', auth.user.id)
    .maybeSingle();
  if (technicianError) {
    return { response: NextResponse.json({ error: 'تعذر تحميل ملف مقدم الخدمة.' }, { status: 500 }) } as const;
  }
  if (!technician) {
    return { response: NextResponse.json({ error: 'ملف مقدم الخدمة غير مكتمل.' }, { status: 404 }) } as const;
  }

  return { supabase, user: auth.user, technician } as const;
}

function validOwnedReceiptPath(path: unknown, userId: string): path is string {
  if (typeof path !== 'string' || !path.startsWith(`${userId}/`)) return false;
  const filename = path.slice(userId.length + 1);
  return /^[0-9a-f-]{36}\.(jpg|png|webp|pdf)$/i.test(filename);
}

export async function GET() {
  const context = await getProvider();
  if ('response' in context) return context.response;

  const [{ data: subscription, error: subscriptionError }, { data: payments, error: paymentsError }] =
    await Promise.all([
      context.supabase
        .from('provider_subscriptions')
        .select('active_until, updated_at')
        .eq('provider_id', context.user.id)
        .maybeSingle(),
      context.supabase
        .from('provider_subscription_payments')
        .select('id, amount, status, rejection_reason, created_at, reviewed_at')
        .eq('provider_id', context.user.id)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

  if (subscriptionError || paymentsError) {
    return NextResponse.json({ error: 'تعذر تحميل حالة الاشتراك. حاول مرة أخرى.' }, { status: 500 });
  }

  const activeUntil = subscription?.active_until ?? null;
  return NextResponse.json({
    amount: PROVIDER_SUBSCRIPTION_AMOUNT_EGP,
    verificationStatus: context.technician.verification_status,
    activeUntil,
    isActive: Boolean(activeUntil && new Date(activeUntil).getTime() > Date.now()),
    payments: payments ?? [],
    pendingPayment: payments?.find((payment) => payment.status === 'pending') ?? null,
  });
}

/** Create a short-lived signed upload URL so receipt files bypass Vercel's body-size limit. */
export async function POST(request: NextRequest) {
  const context = await getProvider();
  if ('response' in context) return context.response;
  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: 'رفع الإيصالات غير متاح حالياً.' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'بيانات الملف غير صالحة.' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'بيانات الملف غير صالحة.' }, { status: 400 });
  }
  const { mimeType, size } = body as { mimeType?: unknown; size?: unknown };
  if (typeof mimeType !== 'string' || !(PROVIDER_SUBSCRIPTION_RECEIPT_MIME_TYPES as readonly string[]).includes(mimeType)) {
    return NextResponse.json({ error: 'نوع الإيصال غير مدعوم. استخدم JPG أو PNG أو WebP أو PDF.' }, { status: 415 });
  }
  if (typeof size !== 'number' || !Number.isInteger(size) || size < 1 || size > PROVIDER_SUBSCRIPTION_RECEIPT_MAX_BYTES) {
    return NextResponse.json({ error: 'يجب ألا يتجاوز حجم الإيصال 5 ميجابايت.' }, { status: 413 });
  }

  const service = createServiceRoleClient();
  const { data: pending, error: pendingError } = await service
    .from('provider_subscription_payments')
    .select('id')
    .eq('provider_id', context.user.id)
    .eq('status', 'pending')
    .maybeSingle();
  if (pendingError) {
    return NextResponse.json({ error: 'تعذر التحقق من طلبات الدفع الحالية.' }, { status: 500 });
  }
  if (pending) {
    return NextResponse.json({ error: 'لديك إيصال قيد المراجعة بالفعل.' }, { status: 409 });
  }

  const extension = fileExtensionByMime[mimeType];
  const path = `${context.user.id}/${crypto.randomUUID()}.${extension}`;
  const { data, error } = await service.storage
    .from(PROVIDER_SUBSCRIPTION_RECEIPTS_BUCKET)
    .createSignedUploadUrl(path);
  if (error || !data) {
    return NextResponse.json({ error: 'تعذر تجهيز رفع الإيصال. حاول مرة أخرى.' }, { status: 502 });
  }

  return NextResponse.json({ path, token: data.token, bucket: PROVIDER_SUBSCRIPTION_RECEIPTS_BUCKET });
}

/** Attach an uploaded private receipt to a pending payment request. */
export async function PATCH(request: NextRequest) {
  const context = await getProvider();
  if ('response' in context) return context.response;
  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: 'تسجيل طلبات الدفع غير متاح حالياً.' }, { status: 503 });
  }

  let body: { path?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'بيانات الإيصال غير صالحة.' }, { status: 400 });
  }
  if (!validOwnedReceiptPath(body.path, context.user.id)) {
    return NextResponse.json({ error: 'مسار الإيصال غير صالح.' }, { status: 400 });
  }

  const service = createServiceRoleClient();
  const [pendingResult, receiptResult] = await Promise.all([
    service.from('provider_subscription_payments').select('id').eq('provider_id', context.user.id).eq('status', 'pending').maybeSingle(),
    service.storage.from(PROVIDER_SUBSCRIPTION_RECEIPTS_BUCKET).list(context.user.id, {
      search: body.path.slice(context.user.id.length + 1),
      limit: 10,
    }),
  ]);
  if (pendingResult.error || receiptResult.error) {
    return NextResponse.json({ error: 'تعذر التحقق من الإيصال. حاول مرة أخرى.' }, { status: 500 });
  }
  if (pendingResult.data) {
    return NextResponse.json({ error: 'لديك إيصال قيد المراجعة بالفعل.' }, { status: 409 });
  }

  const filename = body.path.slice(context.user.id.length + 1);
  const storedObject = receiptResult.data?.find((item) => item.name === filename);
  if (!storedObject) {
    return NextResponse.json({ error: 'لم يتم العثور على الصورة المرفوعة. أعد رفع الإيصال.' }, { status: 422 });
  }
  const metadata = storedObject.metadata as { size?: number; mimetype?: string } | null;
  if (!metadata?.size || metadata.size > PROVIDER_SUBSCRIPTION_RECEIPT_MAX_BYTES ||
      !metadata.mimetype || !(PROVIDER_SUBSCRIPTION_RECEIPT_MIME_TYPES as readonly string[]).includes(metadata.mimetype)) {
    await service.storage.from(PROVIDER_SUBSCRIPTION_RECEIPTS_BUCKET).remove([body.path]);
    return NextResponse.json({ error: 'ملف الإيصال غير صالح أو حجمه أكبر من المسموح.' }, { status: 415 });
  }

  const { data: payment, error: insertError } = await service
    .from('provider_subscription_payments')
    .insert({
      provider_id: context.user.id,
      amount: PROVIDER_SUBSCRIPTION_AMOUNT_EGP,
      receipt_path: body.path,
      status: 'pending',
    })
    .select('id, amount, status, created_at')
    .single();

  if (insertError || !payment) {
    if (insertError?.code === '23505') {
      return NextResponse.json({ error: 'لديك إيصال قيد المراجعة بالفعل.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'تم رفع الإيصال لكن تعذر تسجيل طلب الدفع. حاول مرة أخرى.' }, { status: 500 });
  }

  return NextResponse.json({ payment }, { status: 201 });
}

/** Remove an orphaned upload after the browser reports an upload/finalization error. */
export async function DELETE(request: NextRequest) {
  const context = await getProvider();
  if ('response' in context) return context.response;
  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: 'تعذر تنظيف الإيصال المرفوع.' }, { status: 503 });
  }

  let body: { path?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'بيانات الإيصال غير صالحة.' }, { status: 400 });
  }
  if (!validOwnedReceiptPath(body.path, context.user.id)) {
    return NextResponse.json({ error: 'مسار الإيصال غير صالح.' }, { status: 400 });
  }

  const service = createServiceRoleClient();
  const { data: payment, error: paymentError } = await service
    .from('provider_subscription_payments')
    .select('id')
    .eq('provider_id', context.user.id)
    .eq('receipt_path', body.path)
    .maybeSingle();
  if (paymentError) return NextResponse.json({ error: 'تعذر التحقق من الإيصال.' }, { status: 500 });
  if (payment) return NextResponse.json({ error: 'لا يمكن حذف إيصال مرتبط بطلب دفع.' }, { status: 409 });

  const { error } = await service.storage.from(PROVIDER_SUBSCRIPTION_RECEIPTS_BUCKET).remove([body.path]);
  if (error) return NextResponse.json({ error: 'تعذر حذف ملف الإيصال المؤقت.' }, { status: 500 });
  return NextResponse.json({ success: true });
}

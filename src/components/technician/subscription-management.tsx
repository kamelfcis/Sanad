'use client';

import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageLoading } from '@/components/shared/page-loading';
import { ErrorState } from '@/components/shared/error-state';
import { useProviderSubscription, useSubmitProviderSubscriptionPayment } from '@/hooks/use-provider-subscription';
import {
  PROVIDER_INSTAPAY_HANDLE,
  PROVIDER_INSTAPAY_RECIPIENT,
  PROVIDER_INSTAPAY_URL,
  PROVIDER_SUBSCRIPTION_RECEIPT_MAX_BYTES,
  PROVIDER_SUBSCRIPTION_SUPPORT_PHONE,
  PROVIDER_SUBSCRIPTION_SUPPORT_WHATSAPP,
} from '@/lib/constants/provider-subscription';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Clock3, CreditCard, ExternalLink, ShieldCheck, UploadCloud } from 'lucide-react';

const dateFormatter = new Intl.DateTimeFormat('ar-EG', { dateStyle: 'long' });

export function SubscriptionManagement() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previousActive = useRef<boolean | null>(null);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const subscription = useProviderSubscription();
  const submitPayment = useSubmitProviderSubscriptionPayment();
  const { toast } = useToast();

  useEffect(() => {
    if (subscription.data?.isActive && previousActive.current === false) {
      toast({
        title: 'تم تفعيل الاشتراك',
        description: 'وافق الأدمن على التحويل. تقدر الآن إظهار ملفك للعملاء من صفحة ملفك الشخصي.',
      });
    }
    if (subscription.data) previousActive.current = subscription.data.isActive;
  }, [subscription.data, toast]);

  if (subscription.isLoading) return <PageLoading />;
  if (subscription.error || !subscription.data) {
    return (
      <ErrorState
        title="تعذر تحميل الاشتراك"
        description={subscription.error?.message ?? 'حدث خطأ أثناء تحميل بيانات الاشتراك.'}
        onRetry={() => void subscription.refetch()}
      />
    );
  }

  const data = subscription.data;
  const isPending = Boolean(data.pendingPayment);
  const isVerified = data.verificationStatus === 'verified';
  const canSubmit = !isPending && !submitPayment.isPending;
  const latestRejection = data.payments.find((payment) => payment.status === 'rejected');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    if (!receipt) {
      setFormError('اختر صورة أو ملف الإيصال أولاً.');
      return;
    }
    try {
      await submitPayment.mutateAsync(receipt);
      setReceipt(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'تعذر رفع الإيصال. حاول مرة أخرى.');
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6" dir="rtl">
      <Card className="overflow-hidden border-primary/20 shadow-sm">
        <div className="bg-gradient-to-l from-primary/10 via-card to-card">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <ShieldCheck className="h-6 w-6 text-primary" aria-hidden="true" />
                  اشتراك ظهور الملف للعملاء
                </CardTitle>
                <CardDescription className="mt-2 max-w-xl leading-7">
                  الاشتراك يتيح لك إظهار ملفك واستقبال طلبات الشغل بعد توثيق حسابك.
                </CardDescription>
              </div>
              {data.isActive ? (
                <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">مفعّل</Badge>
              ) : isPending ? (
                <Badge variant="secondary">قيد المراجعة</Badge>
              ) : (
                <Badge variant="outline">غير مفعّل</Badge>
              )}
            </div>
          </CardHeader>
        </div>
        <CardContent className="space-y-6 p-5 sm:p-7">
          <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary">قيمة الاشتراك الشهري</p>
              <p className="mt-1 text-4xl font-black text-text-primary">
                {data.amount} <span className="text-base font-semibold text-text-secondary">جنيه / شهر</span>
              </p>
            </div>
            {data.isActive && data.activeUntil && (
              <p className="rounded-xl bg-card px-4 py-3 text-sm text-text-secondary">
                الاشتراك ساري حتى <strong className="text-text-primary">{dateFormatter.format(new Date(data.activeUntil))}</strong>
              </p>
            )}
          </div>

          {!isVerified && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-7 text-amber-950">
              حسابك تحت مراجعة الإدارة. تقدر تدفع الآن، لكن الملف لن يظهر للعملاء إلا بعد توثيق الحساب وتفعيل الاشتراك.
            </div>
          )}

          {data.isActive && (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm leading-7 text-emerald-900" role="status">
              <CheckCircle2 className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
              <p>تمت مراجعة التحويل وتفعيل الاشتراك. لإظهار ملفك واستقبال الطلبات، فعّل خيار «ظهور الملف الشخصي» من صفحة ملفك.</p>
            </div>
          )}

          {isPending && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-7 text-amber-950" role="status">
              <Clock3 className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-bold">إيصالك وصل وبانتظار المراجعة</p>
                <p>الأدمن سيراجع التحويل. سيظهر تحديث التفعيل هنا تلقائياً بعد الموافقة.</p>
              </div>
            </div>
          )}

          <section className="space-y-3" aria-labelledby="subscription-steps-title">
            <h2 id="subscription-steps-title" className="text-base font-bold text-text-primary">خطوات الاشتراك</h2>
            <ol className="grid gap-3 sm:grid-cols-2">
              {[
                'حوّل 10 جنيهات إلى حساب InstaPay الموضح أدناه.',
                'ارفع صورة التحويل من نفس الصفحة.',
                'يراجع الأدمن الإيصال من لوحة المدفوعات.',
                'بعد التفعيل، أظهر ملفك لاستقبال طلبات الشغل.',
              ].map((step, index) => (
                <li key={step} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 text-sm leading-6 text-text-secondary">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4 sm:p-5" aria-labelledby="instapay-title">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CreditCard className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="instapay-title" className="font-bold text-text-primary">بيانات الدفع عبر InstaPay</h2>
                <p className="mt-1 text-sm text-text-secondary">المستلم: {PROVIDER_INSTAPAY_RECIPIENT}</p>
                <p className="mt-1 break-all font-mono text-sm text-text-primary" dir="ltr">{PROVIDER_INSTAPAY_HANDLE}</p>
              </div>
            </div>
            <Button asChild className="mt-4 w-full sm:w-auto">
              <a href={PROVIDER_INSTAPAY_URL} target="_blank" rel="noopener noreferrer">
                فتح InstaPay وتحويل 10 جنيهات
                <ExternalLink className="me-2 h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
          </section>

          {latestRejection && !isPending && !data.isActive && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-7 text-destructive" role="alert">
              <p className="font-semibold">الإيصال السابق لم يُقبل</p>
              <p>{latestRejection.rejection_reason || 'راجع الإيصال وأعد رفع صورة واضحة.'}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-surface/40 p-4 sm:p-5">
            <div>
              <h2 className="font-bold text-text-primary">رفع إيصال التحويل</h2>
              <p className="mt-1 text-sm leading-6 text-text-secondary">JPG أو PNG أو WebP أو PDF، بحد أقصى 5 ميجابايت. الملف يرفع مباشرة إلى التخزين الخاص.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subscription-receipt">صورة أو ملف الإيصال</Label>
              <Input
                ref={fileInputRef}
                id="subscription-receipt"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                disabled={!canSubmit}
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setReceipt(file);
                  setFormError(null);
                  if (file && file.size > PROVIDER_SUBSCRIPTION_RECEIPT_MAX_BYTES) {
                    setFormError('حجم الإيصال أكبر من 5 ميجابايت.');
                    setReceipt(null);
                  }
                }}
                className="cursor-pointer file:me-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-primary"
              />
              {receipt && <p className="text-xs text-text-secondary">الملف المختار: {receipt.name}</p>}
            </div>
            {formError && <p className="text-sm text-destructive" role="alert">{formError}</p>}
            {submitPayment.isSuccess ? (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-800" role="status">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                تم رفع الإيصال وإرساله للمراجعة. سيظهر طلبك في لوحة مدفوعات الأدمن.
              </div>
            ) : (
              <Button type="submit" disabled={!canSubmit || !receipt} className="w-full sm:w-auto">
                <UploadCloud className="me-2 h-4 w-4" aria-hidden="true" />
                {submitPayment.isPending ? 'جارٍ رفع الإيصال...' : 'إرسال الإيصال للمراجعة'}
              </Button>
            )}
            {submitPayment.isPending && (
              <p className="text-sm leading-6 text-text-secondary" role="status">
                جاري رفع الإيصال والتحقق من تسجيله. لو واجهت مشكلة اتصل على {PROVIDER_SUBSCRIPTION_SUPPORT_PHONE} أو تواصل معنا على واتساب.
              </p>
            )}
          </form>

          <div className="rounded-xl border border-border p-4 text-sm leading-7 text-text-secondary">
            <p className="font-semibold text-text-primary">محتاج مساعدة؟</p>
            <p>لو واجهتك مشكلة في الدفع أو رفع الإيصال، تواصل مع الدعم.</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <a className="font-semibold text-primary underline-offset-4 hover:underline" href={`tel:${PROVIDER_SUBSCRIPTION_SUPPORT_PHONE}`} dir="ltr">
                {PROVIDER_SUBSCRIPTION_SUPPORT_PHONE}
              </a>
              <a
                className="font-semibold text-primary underline-offset-4 hover:underline"
                href={`https://wa.me/${PROVIDER_SUBSCRIPTION_SUPPORT_WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                واتساب الدعم
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

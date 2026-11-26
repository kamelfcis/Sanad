'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Banknote, CheckCircle2, ExternalLink, RefreshCw, XCircle } from 'lucide-react';

type Status = 'pending' | 'approved' | 'rejected';
type SubscriptionPayment = {
  id: string;
  provider_id: string;
  amount: number;
  status: Status;
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  receiptUrl: string | null;
  receiptType: string | null;
  provider: { id: string; full_name: string | null; email: string | null; phone: string | null } | null;
  providerProfile: { provider_role: string | null; governorate: string | null; area: string | null } | null;
};
type PaymentResponse = { payments: SubscriptionPayment[]; total: number; page: number; limit: number };

const filters: { label: string; value: Status }[] = [
  { label: 'بانتظار المراجعة', value: 'pending' },
  { label: 'مقبولة', value: 'approved' },
  { label: 'مرفوضة', value: 'rejected' },
];
const statusLabels: Record<Status, string> = {
  pending: 'بانتظار المراجعة',
  approved: 'مقبول',
  rejected: 'مرفوض',
};

export default function AdminProviderSubscriptionsPage() {
  const [filter, setFilter] = useState<Status>('pending');
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [total, setTotal] = useState(0);

  const loadPayments = useCallback(async (background = false) => {
    if (background) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/provider-subscription-payments?status=${filter}&page=1&limit=50`, { cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? 'تعذر تحميل طلبات الدفع.');
      const data = result as PaymentResponse;
      setPayments(data.payments ?? []);
      setTotal(data.total ?? 0);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل طلبات الدفع.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filter]);

  useEffect(() => { void loadPayments(); }, [loadPayments]);

  const reviewPayment = async (id: string, decision: 'approve' | 'reject') => {
    if (decision === 'reject' && !rejectionReason.trim()) return;
    setWorkingId(id);
    try {
      const response = await fetch(`/api/admin/provider-subscription-payments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, rejectionReason: decision === 'reject' ? rejectionReason.trim() : undefined }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? 'تعذر تحديث طلب الدفع.');
      toast({
        title: decision === 'approve' ? 'تم قبول الدفع وتفعيل الاشتراك' : 'تم رفض الإيصال',
        description: decision === 'approve'
          ? 'تم تفعيل الاشتراك لمدة شهر. سيظهر التحديث لدى مقدم الخدمة.'
          : 'تم حفظ سبب الرفض ليظهر لمقدم الخدمة.',
      });
      setRejectingId(null);
      setRejectionReason('');
      await loadPayments(true);
    } catch (reviewError) {
      toast({ title: 'تعذر مراجعة الطلب', description: reviewError instanceof Error ? reviewError.message : 'حدث خطأ غير متوقع.', variant: 'destructive' });
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6" dir="rtl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary sm:text-3xl">
            <Banknote className="h-7 w-7 text-primary" aria-hidden="true" />
            مدفوعات اشتراكات مقدمي الخدمة
          </h1>
          <p className="mt-2 text-sm text-text-secondary">راجع إيصال InstaPay ثم اقبل الدفع لتفعيل الاشتراك الشهري بقيمة 10 جنيهات.</p>
        </div>
        <Button variant="outline" onClick={() => void loadPayments(true)} disabled={isRefreshing}>
          <RefreshCw className={`ms-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
          تحديث الطلبات
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="تصفية طلبات الدفع">
        {filters.map((item) => (
          <Button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={filter === item.value}
            variant={filter === item.value ? 'default' : 'outline'}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </Button>
        ))}
        <Badge variant="secondary" className="self-center px-3 py-1">{total} طلب</Badge>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-56 rounded-2xl" />)}</div>
      ) : error ? (
        <Card><CardContent className="flex flex-col items-start gap-3 p-5"><p className="text-sm text-destructive">{error}</p><Button variant="outline" onClick={() => void loadPayments()}>إعادة المحاولة</Button></CardContent></Card>
      ) : payments.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-14 text-center"><CheckCircle2 className="h-10 w-10 text-emerald-600" /><p className="font-semibold text-text-primary">لا توجد طلبات {statusLabels[filter]} حالياً.</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => {
            const roleLabel = payment.providerProfile?.provider_role === 'contractor' ? 'مقاول' : 'فني';
            const location = [payment.providerProfile?.area, payment.providerProfile?.governorate].filter(Boolean).join('، ');
            const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(payment.receiptType ?? '');
            return (
              <Card key={payment.id} className="overflow-hidden">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold text-text-primary">{payment.provider?.full_name ?? 'مقدم خدمة'}</h2>
                        <Badge variant="outline">{roleLabel}</Badge>
                        <Badge variant={payment.status === 'approved' ? 'default' : payment.status === 'rejected' ? 'destructive' : 'secondary'}>
                          {statusLabels[payment.status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-text-secondary">{payment.amount} جنيه — اشتراك شهر واحد</p>
                      {location && <p className="text-sm text-text-secondary">{location}</p>}
                      {payment.provider?.phone && <p className="text-sm text-text-secondary" dir="ltr">{payment.provider.phone}</p>}
                      <p className="text-xs text-text-muted">تاريخ الإرسال: {new Date(payment.created_at).toLocaleString('ar-EG')}</p>
                      {payment.rejection_reason && <p className="rounded-lg bg-destructive/5 p-3 text-sm text-destructive">سبب الرفض: {payment.rejection_reason}</p>}
                      {payment.receiptUrl ? (
                        <div className="space-y-2 pt-2">
                          {isImage && (
                            <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer" aria-label="فتح صورة إيصال التحويل بالحجم الكامل">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={payment.receiptUrl} alt={`إيصال تحويل ${payment.provider?.full_name ?? ''}`} className="max-h-96 max-w-full rounded-xl border border-border object-contain" />
                            </a>
                          )}
                          <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline">
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                            {isImage ? 'فتح صورة الإيصال' : 'فتح ملف الإيصال'}
                          </a>
                        </div>
                      ) : <p className="text-sm text-destructive">تعذر تحميل ملف الإيصال. حدّث الطلبات وحاول مرة أخرى.</p>}
                    </div>

                    {payment.status === 'pending' && (
                      <div className="flex shrink-0 flex-col gap-2 sm:flex-row xl:flex-col">
                        <Button onClick={() => void reviewPayment(payment.id, 'approve')} disabled={workingId === payment.id || !payment.receiptUrl}>
                          <CheckCircle2 className="ms-2 h-4 w-4" aria-hidden="true" />
                          {workingId === payment.id ? 'جارٍ الحفظ...' : 'قبول وتفعيل الاشتراك'}
                        </Button>
                        {rejectingId === payment.id ? (
                          <div className="space-y-2 rounded-xl border border-border p-3">
                            <Input value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="اكتب سبب الرفض" aria-label="سبب رفض الإيصال" />
                            <div className="flex gap-2">
                              <Button size="sm" variant="destructive" onClick={() => void reviewPayment(payment.id, 'reject')} disabled={!rejectionReason.trim() || workingId === payment.id}>تأكيد الرفض</Button>
                              <Button size="sm" variant="outline" onClick={() => { setRejectingId(null); setRejectionReason(''); }}>إلغاء</Button>
                            </div>
                          </div>
                        ) : (
                          <Button variant="outline" onClick={() => { setRejectingId(payment.id); setRejectionReason(''); }}>
                            <XCircle className="ms-2 h-4 w-4" aria-hidden="true" /> رفض الإيصال
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

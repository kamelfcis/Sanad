'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { PageLoading } from '@/components/shared/page-loading';
import { AdminCustomerFlowPreviewNotice } from '@/components/shared/admin-customer-flow-preview-notice';
import { useAuthStore } from '@/store/auth-store';

function NewQuoteForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { profile } = useAuthStore();
  const adminPreview = profile?.role === 'admin';
  const contractorId = searchParams.get('contractor_id') ?? '';
  const specialty = searchParams.get('specialty') ?? '';
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (adminPreview) {
      toast({
        title: 'معاينة فقط',
        description: 'لا يمكن للإدارة إرسال طلب عرض سعر نيابة عن العميل.',
        variant: 'destructive',
      });
      return;
    }
    if (!contractorId) {
      toast({ title: 'اختر مقاولًا من قائمة التصفح', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/quote-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractor_id: contractorId,
          specialty: specialty || null,
          project_description: description,
          address,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        const message = typeof body.error === 'string' ? body.error : 'تعذّر إرسال الطلب';
        toast({ title: 'تعذّر إرسال الطلب', description: message, variant: 'destructive' });
        return;
      }
      toast({ title: 'تم إرسال تفاصيل المشروع' });
      router.push('/customer/quotes');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container max-w-2xl py-8" dir="rtl">
      <AdminCustomerFlowPreviewNotice />
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/services?providerRole=contractor">العودة إلى المقاولين</Link>
      </Button>
      <h1 className="text-2xl font-bold">تفاصيل المشروع</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        أرسل وصف المشروع والعنوان ليقدّم المقاول عرض السعر.
      </p>
      <form onSubmit={(event) => void onSubmit(event)} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="project-description">وصف المشروع</Label>
          <Textarea
            id="project-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            minLength={10}
            required
            className="min-h-[120px]"
            placeholder="اشرح أعمال المشروع والمساحة والمدة المتوقعة..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="project-address">العنوان</Label>
          <Input
            id="project-address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            minLength={5}
            required
            placeholder="المحافظة، الحي، الشارع"
          />
        </div>
        <Button type="submit" disabled={submitting || adminPreview} title={adminPreview ? 'معاينة للإدارة فقط' : undefined}>
          إرسال طلب عرض السعر
        </Button>
      </form>
    </div>
  );
}

export default function NewQuotePage() {
  return (
    <Suspense fallback={<PageLoading className="py-16" />}>
      <NewQuoteForm />
    </Suspense>
  );
}

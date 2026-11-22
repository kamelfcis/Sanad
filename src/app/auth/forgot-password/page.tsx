'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { normalizeEgyptianPhone } from '@/lib/constants/technician-registration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { SplitLayout } from '@/components/auth/split-layout';
import { Loader2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const customerSchema = z.object({
  email: z.string().email('أدخل بريدًا إلكترونيًا صالحًا'),
});

const technicianSchema = z.object({
  phone: z
    .string()
    .min(1, 'رقم الموبايل مطلوب')
    .transform(normalizeEgyptianPhone)
    .refine((phone) => /^01[0125]\d{8}$/.test(phone), 'رقم موبايل غير صالح'),
  nationalId: z.string().regex(/^\d{14}$/, 'الرقم القومي 14 رقم'),
  newPassword: z.string().min(8, 'كلمة المرور 8 أحرف على الأقل'),
  confirmPassword: z.string().min(8),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'كلمتا المرور غير متطابقتين',
  path: ['confirmPassword'],
});

type Mode = 'customer' | 'technician';

export default function ForgotPasswordPage() {
  const [mode, setMode] = useState<Mode>('customer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerSent, setCustomerSent] = useState(false);
  const [techDone, setTechDone] = useState(false);
  const supabase = createClient();

  const customerForm = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
  });

  const technicianForm = useForm<z.infer<typeof technicianSchema>>({
    resolver: zodResolver(technicianSchema),
  });

  const onCustomerSubmit = async (data: z.infer<typeof customerSchema>) => {
    setIsSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    setIsSubmitting(false);
    if (error) {
      toast({
        title: 'تعذّر إرسال رابط الاستعادة',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }
    setCustomerSent(true);
    toast({ title: 'تم إرسال رابط استعادة كلمة المرور' });
  };

  const onTechnicianSubmit = async (data: z.infer<typeof technicianSchema>) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/technician-reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: data.phone,
          nationalId: data.nationalId,
          newPassword: data.newPassword,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast({
          title: 'تعذّر تعيين كلمة المرور',
          description: result.error ?? 'تحقق من البيانات',
          variant: 'destructive',
        });
        return;
      }
      setTechDone(true);
      toast({ title: 'تم تعيين كلمة مرور جديدة' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SplitLayout>
      <div className="mx-auto w-full max-w-md space-y-6" dir="rtl">
        <Link href="/auth/login" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          العودة لتسجيل الدخول
        </Link>
        <div>
          <h1 className="text-2xl font-bold">استعادة كلمة المرور</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            العملاء عبر البريد — الصنايعي عبر الموبايل والرقم القومي بدون رسائل على الإيميل الوهمي.
          </p>
        </div>

        <div className="flex rounded-xl border border-border p-1">
          <button
            type="button"
            className={cn(
              'flex-1 rounded-lg py-2 text-sm font-semibold transition-colors',
              mode === 'customer' ? 'bg-primary text-white' : 'text-muted-foreground',
            )}
            onClick={() => setMode('customer')}
          >
            عميل
          </button>
          <button
            type="button"
            className={cn(
              'flex-1 rounded-lg py-2 text-sm font-semibold transition-colors',
              mode === 'technician' ? 'bg-primary text-white' : 'text-muted-foreground',
            )}
            onClick={() => setMode('technician')}
          >
            صنايعي
          </button>
        </div>

        {mode === 'customer' ? (
          customerSent ? (
            <p className="rounded-lg border bg-muted/40 p-4 text-sm" aria-live="polite">
              إذا كان الحساب موجودًا، ستصلك رسالة خلال دقائق. تحقق من البريد الوارد ومجلد الرسائل غير المرغوب فيها.
            </p>
          ) : (
            <form onSubmit={customerForm.handleSubmit(onCustomerSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input id="email" type="email" autoComplete="email" {...customerForm.register('email')} />
                {customerForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{customerForm.formState.errors.email.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                إرسال رابط الاستعادة
              </Button>
            </form>
          )
        ) : techDone ? (
          <p className="rounded-lg border bg-muted/40 p-4 text-sm">
            تم تعيين كلمة المرور.{' '}
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
              سجّل الدخول برقم الموبايل وكلمة المرور الجديدة
            </Link>
          </p>
        ) : (
          <form onSubmit={technicianForm.handleSubmit(onTechnicianSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الموبايل</Label>
              <Input id="phone" type="tel" dir="ltr" autoComplete="tel" {...technicianForm.register('phone')} />
              {technicianForm.formState.errors.phone && (
                <p className="text-xs text-destructive">{technicianForm.formState.errors.phone.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nationalId">الرقم القومي المسجّل</Label>
              <Input id="nationalId" maxLength={14} dir="ltr" {...technicianForm.register('nationalId')} />
              {technicianForm.formState.errors.nationalId && (
                <p className="text-xs text-destructive">{technicianForm.formState.errors.nationalId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
              <Input id="newPassword" type="password" autoComplete="new-password" {...technicianForm.register('newPassword')} />
              {technicianForm.formState.errors.newPassword && (
                <p className="text-xs text-destructive">{technicianForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <Input id="confirmPassword" type="password" {...technicianForm.register('confirmPassword')} />
              {technicianForm.formState.errors.confirmPassword && (
                <p className="text-xs text-destructive">{technicianForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              تعيين كلمة مرور جديدة
            </Button>
          </form>
        )}
      </div>
    </SplitLayout>
  );
}

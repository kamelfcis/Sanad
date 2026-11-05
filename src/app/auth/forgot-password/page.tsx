'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { SplitLayout } from '@/components/auth/split-layout';
import { Loader2, ArrowLeft } from 'lucide-react';

const schema = z.object({
  email: z.string().email('أدخل بريدًا إلكترونيًا صالحًا'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
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
    setSent(true);
    toast({ title: 'تم إرسال رابط استعادة كلمة المرور' });
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
            أدخل بريدك الإلكتروني وسنرسل رابطًا لتعيين كلمة مرور جديدة.
          </p>
        </div>
        {sent ? (
          <p className="rounded-lg border bg-muted/40 p-4 text-sm" aria-live="polite">
            إذا كان الحساب موجودًا، ستصلك رسالة خلال دقائق. تحقق من البريد الوارد ومجلد الرسائل غير المرغوب فيها.
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                placeholder="you@example.com…"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              إرسال رابط الاستعادة
            </Button>
          </form>
        )}
      </div>
    </SplitLayout>
  );
}

'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { registerSchema, type RegisterInput } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { SplitLayout } from '@/components/auth/split-layout';
import { PageLoading } from '@/components/shared/page-loading';
import { Loader2, ArrowLeft, UserCheck, Wrench as ToolIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

function RegisterForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get('role') === 'technician' ? 'technician' : 'customer';
  const supabase = createClient();

  useEffect(() => {
    if (defaultRole === 'technician') {
      router.replace('/auth/register-technician');
    }
  }, [defaultRole, router]);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: defaultRole },
  });

  const selectedRole = watch('role');

  const handleGoogleSignup = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback?role=${selectedRole}` },
    });
  };

  const onEmailSignup = async (data: RegisterInput) => {
    setIsSubmitting(true);
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email, password: data.password,
      options: { data: { full_name: data.fullName, role: data.role } },
    });
    if (error) { toast({ title: 'Registration failed', description: error.message, variant: 'destructive' }); setIsSubmitting(false); return; }
    if (authData.user?.identities?.length === 0) { toast({ title: 'Account already exists', description: 'An account with this email already exists.', variant: 'destructive' }); setIsSubmitting(false); return; }
    if (authData.user) {
      await supabase.from('profiles').upsert({ id: authData.user.id, email: data.email, full_name: data.fullName, role: data.role }, { onConflict: 'id' });
    }
    toast({ title: 'تم إنشاء الحساب بنجاح!', description: 'يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب.' });
    setIsSubmitting(false);
    router.push('/auth/login');
  };

  return (
    <SplitLayout title="انضم إلى سند" subtitle="اختر دورك وابدأ رحلتك مع منصة الخدمات المنزلية الرائدة">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'var(--font-heading)' }}>إنشاء حساب جديد</h2>
          <p className="mt-1 text-sm text-text-secondary">اختر نوع الحساب لتبدأ</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setValue('role', 'customer')}
            className={cn('flex flex-col items-center gap-2 rounded-xl border-2 p-5 text-center transition-all',
              selectedRole === 'customer' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            )}
          >
            <UserCheck className={cn('h-8 w-8', selectedRole === 'customer' ? 'text-primary' : 'text-text-muted')} />
            <span className={cn('text-sm font-medium', selectedRole === 'customer' ? 'text-primary' : 'text-text-primary')}>عميل</span>
            <span className="text-xs text-text-secondary">أحتاج خدمات منزلية</span>
          </button>
          <button
            type="button"
            onClick={() => router.push('/auth/register-technician')}
            className={cn('flex flex-col items-center gap-2 rounded-xl border-2 p-5 text-center transition-all',
              selectedRole === 'technician' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            )}
          >
            <ToolIcon className={cn('h-8 w-8', selectedRole === 'technician' ? 'text-primary' : 'text-text-muted')} />
            <span className={cn('text-sm font-medium', selectedRole === 'technician' ? 'text-primary' : 'text-text-primary')}>فني</span>
            <span className="text-xs text-text-secondary">أقدم خدمات منزلية</span>
          </button>
          {errors.role && <p className="col-span-2 text-center text-xs text-destructive">{errors.role.message}</p>}
        </div>

        <Button variant="outline" className="w-full border-border text-text-primary hover:bg-surface" onClick={handleGoogleSignup}>
          <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </Button>

        <div className="flex items-center gap-2">
          <Separator className="flex-1 bg-border" />
          <span className="text-xs text-text-muted">أو</span>
          <Separator className="flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit(onEmailSignup)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-text-primary">الاسم الكامل</Label>
            <Input id="fullName" placeholder="أحمد حسن" autoComplete="name"
              className="border-border bg-card text-text-primary placeholder:text-text-muted focus:border-primary" {...register('fullName')} />
            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-text-primary">البريد الإلكتروني</Label>
            <Input id="email" type="email" placeholder="you@example.com" autoComplete="email"
              className="border-border bg-card text-text-primary placeholder:text-text-muted focus:border-primary" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-text-primary">كلمة المرور</Label>
            <Input id="password" type="password" placeholder="8 أحرف على الأقل" autoComplete="new-password"
              className="border-border bg-card text-text-primary placeholder:text-text-muted focus:border-primary" {...register('password')} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-text-primary">تأكيد كلمة المرور</Label>
            <Input id="confirmPassword" type="password" placeholder="أعد إدخال كلمة المرور" autoComplete="new-password"
              className="border-border bg-card text-text-primary placeholder:text-text-muted focus:border-primary" {...register('confirmPassword')} />
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
          </div>
          <Button type="submit" className="w-full bg-gradient-to-br from-primary to-accent text-white shadow-sm hover:shadow-md hover:brightness-105" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            إنشاء حساب
          </Button>
        </form>

        <p className="text-center text-sm text-text-secondary">
          لديك حساب بالفعل؟{' '}
          <Link href="/auth/login" className="font-medium text-primary hover:underline">تسجيل الدخول</Link>
        </p>
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary">
            <ArrowLeft className="h-3 w-3" />
            العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    </SplitLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <PageLoading />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}

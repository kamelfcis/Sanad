'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';
import { phoneToTechnicianEmail, normalizeEgyptianPhone } from '@/lib/constants/technician-registration';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { SplitLayout } from '@/components/auth/split-layout';
import { getSafeInternalRedirect } from '@/lib/auth/safe-redirect';
import { Loader2, ArrowLeft } from 'lucide-react';

function LoginForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeInternalRedirect(searchParams.get('next'));
  const { setUser, setProfile, setLoading, setSessionResolved } = useAuthStore();
  const supabase = createClient();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const redirectAfterAuth = async (role: string, userId: string) => {
    if (nextPath && role === 'customer') {
      router.push(nextPath);
      router.refresh();
      return;
    }

    if (role === 'technician') {
      const { data: tp } = await supabase
        .from('technician_profiles')
        .select('national_id, governorate, bio, profile_photo_url, id_card_photo_url')
        .eq('id', userId)
        .maybeSingle();
      const { count } = await supabase
        .from('technician_skills')
        .select('*', { count: 'exact', head: true })
        .eq('technician_id', userId);
      const { isTechnicianProfileComplete } = await import('@/lib/technician/profile-complete');
      router.push(
        isTechnicianProfileComplete(tp, count ?? 0)
          ? '/technician/jobs'
          : '/auth/register-technician?complete=1',
      );
    } else {
      const m: Record<string, string> = { customer: '/services', admin: '/admin' };
      router.push(m[role] ?? '/services');
    }
    router.refresh();
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const redirectTo = nextPath
      ? `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(nextPath)}`
      : `${window.location.origin}/api/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) {
      toast({ title: 'فشل تسجيل الدخول عبر Google', description: error.message, variant: 'destructive' });
      setLoading(false);
    }
  };

  const onEmailLogin = async (data: LoginInput) => {
    setIsSubmitting(true);
    const emailInput = data.email.trim();
    const loginEmail = /^01[0125]\d{8}$/.test(normalizeEgyptianPhone(emailInput))
      ? phoneToTechnicianEmail(emailInput)
      : emailInput;
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: data.password });
    if (error) {
      toast({
        title: 'فشل تسجيل الدخول',
        description:
          error.message === 'Invalid login credentials'
            ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'
            : error.message,
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (profile) {
        setProfile(profile);
        setLoading(false);
        setSessionResolved(true);
        await redirectAfterAuth(profile.role, session.user.id);
      }
    }
    setIsSubmitting(false);
  };

  return (
    <SplitLayout title="مرحباً بك في سند" subtitle="منصة الخدمات المنزلية الأكثر موثوقية في المملكة">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'var(--font-heading)' }}>تسجيل الدخول</h2>
          <p className="mt-1 text-sm text-text-secondary">أدخل بياناتك للوصول إلى حسابك</p>
        </div>

        <Button variant="outline" className="w-full border-border text-text-primary hover:bg-surface" onClick={handleGoogleLogin}>
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

        <form onSubmit={handleSubmit(onEmailLogin)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-text-primary">البريد الإلكتروني أو رقم الموبايل</Label>
            <Input
              id="email"
              type="text"
              placeholder="you@example.com أو 01xxxxxxxxx"
              autoComplete="username"
              className="border-border bg-card text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-primary/20"
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-text-primary">كلمة المرور</Label>
              <Link href="/auth/forgot-password" className="text-xs font-medium text-primary hover:underline">نسيت كلمة المرور؟</Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              className="border-border bg-card text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-primary/20"
              {...register('password')}
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-br from-primary to-accent text-white shadow-sm hover:shadow-md hover:brightness-105"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            تسجيل الدخول
          </Button>
        </form>

        <p className="text-center text-sm text-text-secondary">
          ليس لديك حساب؟{' '}
          <Link href="/auth/register" className="font-medium text-primary hover:underline">إنشاء حساب جديد</Link>
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

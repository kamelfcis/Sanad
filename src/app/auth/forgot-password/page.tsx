'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, CheckCircle, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('يرجى إدخال بريد إلكتروني صحيح'); return; }
    setError('');
    setIsSubmitting(true);
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/update-password` });
    setSent(true);
    setIsSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-surface dark:from-[#0B1720] dark:to-[#122430] p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm"
      >
        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#10B981]/10">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-text-primary">تحقق من بريدك</h2>
            <p className="mb-8 text-text-secondary">إذا كان البريد الإلكتروني مسجلاً، ستتلقى رابط إعادة تعيين كلمة المرور.</p>
            <Link href="/auth/login" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              <ArrowLeft className="h-4 w-4" /> العودة لتسجيل الدخول
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary">نسيت كلمة المرور؟</h2>
              <p className="mt-1 text-sm text-text-secondary">أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-text-primary">البريد الإلكتروني</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="border-border bg-card text-text-primary placeholder:text-text-muted focus:border-primary" />
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>
              <Button type="submit" className="w-full bg-gradient-to-br from-primary to-accent text-white shadow-sm hover:shadow-md" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                إرسال رابط إعادة التعيين
              </Button>
            </form>
            <div className="mt-6 text-center">
              <Link href="/auth/login" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                <ArrowLeft className="h-4 w-4" /> العودة لتسجيل الدخول
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

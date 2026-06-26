'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { z } from 'zod';

const schema = z.object({ password: z.string().min(8, 'كلمة المرور يجب أن تكون ٨ أحرف على الأقل'), confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, { message: 'كلمات المرور غير متطابقة', path: ['confirmPassword'] });

type FormData = z.infer<typeof schema>;

export default function UpdatePasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: data.password });
    if (error) { toast({ title: 'Failed to update password', description: error.message, variant: 'destructive' }); setIsSubmitting(false); return; }
    toast({ title: 'Password updated successfully' });
    router.push('/auth/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-surface dark:from-[#0B1720] dark:to-[#122430] p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">تحديث كلمة المرور</h2>
          <p className="mt-1 text-sm text-text-secondary">أدخل كلمة المرور الجديدة</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-text-primary">كلمة المرور الجديدة</Label>
            <Input id="password" type="password" placeholder="8 أحرف على الأقل"
              className="border-border bg-card text-text-primary placeholder:text-text-muted focus:border-primary" {...register('password')} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-text-primary">تأكيد كلمة المرور</Label>
            <Input id="confirmPassword" type="password" placeholder="أعد إدخال كلمة المرور"
              className="border-border bg-card text-text-primary placeholder:text-text-muted focus:border-primary" {...register('confirmPassword')} />
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
          </div>
          <Button type="submit" className="w-full bg-gradient-to-br from-primary to-accent text-white shadow-sm hover:shadow-md" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            تحديث كلمة المرور
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

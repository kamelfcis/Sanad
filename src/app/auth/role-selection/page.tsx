'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserCheck, Wrench as ToolIcon, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RoleSelectionPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-surface dark:from-[#0B1720] dark:to-[#122430] p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-text-primary" style={{ fontFamily: 'var(--font-heading)' }}>اختر نوع حسابك</h1>
          <p className="text-text-secondary">هل تريد الحصول على خدمات أم تقديمها؟</p>
        </div>
        <div className="grid gap-4">
          <motion.button whileHover={{ scale: 1.01 }} onClick={() => router.push('/auth/register?role=customer')}
            className="group flex items-center gap-6 rounded-2xl border border-border bg-card p-6 text-right shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent">
              <UserCheck className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="mb-1 text-xl font-semibold text-text-primary" style={{ fontFamily: 'var(--font-cairo)' }}>عميل</h3>
              <p className="text-sm text-text-secondary">أحتاج خدمات منزلية — احجز فنيين معتمدين</p>
            </div>
            <ArrowLeft className="h-5 w-5 text-text-muted transition-transform group-hover:-translate-x-1" />
          </motion.button>
          <motion.button whileHover={{ scale: 1.01 }} onClick={() => router.push('/auth/register-technician')}
            className="group flex items-center gap-6 rounded-2xl border border-border bg-card p-6 text-right shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary to-[#2F7084]">
              <ToolIcon className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="mb-1 text-xl font-semibold text-text-primary" style={{ fontFamily: 'var(--font-cairo)' }}>فني</h3>
              <p className="text-sm text-text-secondary">أقدم خدمات منزلية — انضم إلى فريق الفنيين</p>
            </div>
            <ArrowLeft className="h-5 w-5 text-text-muted transition-transform group-hover:-translate-x-1" />
          </motion.button>
        </div>
        <div className="mt-8 text-center">
          <Link href="/auth/login" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> لدي حساب بالفعل — تسجيل دخول
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

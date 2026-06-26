'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TechnicianRegisterLayout } from '@/components/auth/technician-register-layout';
import { TechnicianRegistrationForm } from '@/components/auth/technician-registration-form';
import { PageLoading } from '@/components/shared/page-loading';
import { createClient } from '@/lib/supabase/client';

function RegisterTechnicianContent() {
  const searchParams = useSearchParams();
  const isCompleteMode = searchParams.get('complete') === '1';
  const router = useRouter();

  useEffect(() => {
    if (!isCompleteMode) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace('/auth/register-technician');
    });
  }, [isCompleteMode, router]);

  return (
    <TechnicianRegisterLayout showLoginLink={!isCompleteMode}>
      <TechnicianRegistrationForm mode={isCompleteMode ? 'complete' : 'signup'} />
    </TechnicianRegisterLayout>
  );
}

export default function RegisterTechnicianPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-surface">
          <PageLoading />
        </div>
      }
    >
      <RegisterTechnicianContent />
    </Suspense>
  );
}

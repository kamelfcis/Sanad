'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TechnicianRegistrationForm } from '@/components/auth/technician-registration-form';
import { TechnicianRegisterLayout } from '@/components/auth/technician-register-layout';
import { PageLoading } from '@/components/shared/page-loading';

function RegisterTechnicianContent() {
  const searchParams = useSearchParams();
  const complete = searchParams.get('complete') === '1';
  const asContractor = searchParams.get('as') === 'contractor';
  return (
    <TechnicianRegisterLayout
      audience={asContractor ? 'contractor' : 'technician'}
      showLoginLink={!complete}
    >
      <TechnicianRegistrationForm mode={complete ? 'complete' : 'signup'} />
    </TechnicianRegisterLayout>
  );
}

export default function RegisterTechnicianPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <PageLoading />
        </div>
      }
    >
      <RegisterTechnicianContent />
    </Suspense>
  );
}

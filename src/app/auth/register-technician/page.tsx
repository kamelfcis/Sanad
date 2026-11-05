'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TechnicianRegistrationForm } from '@/components/auth/technician-registration-form';
import { PageLoading } from '@/components/shared/page-loading';

function RegisterTechnicianContent() {
  const searchParams = useSearchParams();
  const complete = searchParams.get('complete') === '1';
  return <TechnicianRegistrationForm mode={complete ? 'complete' : 'signup'} />;
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

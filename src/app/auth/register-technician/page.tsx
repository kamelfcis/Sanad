'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TechnicianRegisterLayout } from '@/components/auth/technician-register-layout';
import { TechnicianRegistrationForm } from '@/components/auth/technician-registration-form';
import { PageLoading } from '@/components/shared/page-loading';
import { createClient } from '@/lib/supabase/client';
import {
  getTechnicianProfileMissingFields,
  TECHNICIAN_PROFILE_MISSING_LABELS,
  type TechnicianProfileMissingField,
} from '@/lib/technician/profile-complete';
import { AlertCircle } from 'lucide-react';

function RegisterTechnicianContent() {
  const searchParams = useSearchParams();
  const isCompleteMode = searchParams.get('complete') === '1';
  const router = useRouter();
  const [missingFields, setMissingFields] = useState<TechnicianProfileMissingField[] | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(isCompleteMode);

  useEffect(() => {
    if (!isCompleteMode) return;

    let cancelled = false;
    const supabase = createClient();

    async function checkProfile() {
      setCheckingProfile(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!user) {
        router.replace('/auth/register-technician');
        return;
      }

      const { data: tp } = await supabase
        .from('technician_profiles')
        .select('national_id, governorate, bio, profile_photo_url, id_card_photo_url')
        .eq('id', user.id)
        .maybeSingle();

      const { count } = await supabase
        .from('technician_skills')
        .select('*', { count: 'exact', head: true })
        .eq('technician_id', user.id);

      if (cancelled) return;

      const missing = getTechnicianProfileMissingFields(tp, count ?? 0);
      if (missing.length === 0) {
        router.replace('/technician/jobs');
        return;
      }

      setMissingFields(missing);
      setCheckingProfile(false);
    }

    void checkProfile();

    return () => {
      cancelled = true;
    };
  }, [isCompleteMode, router]);

  if (isCompleteMode && checkingProfile) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <PageLoading />
      </div>
    );
  }

  return (
    <>
      {isCompleteMode && missingFields && missingFields.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium text-amber-900">بيانات ناقصة في ملفك</p>
            <p className="mt-1 text-sm text-amber-800">
              أكمل الحقول التالية لتفعيل حسابك كفني:
            </p>
            <ul className="mt-2 list-inside list-disc text-sm text-amber-800">
              {missingFields.map((field) => (
                <li key={field}>{TECHNICIAN_PROFILE_MISSING_LABELS[field].ar}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <TechnicianRegistrationForm mode={isCompleteMode ? 'complete' : 'signup'} />
    </>
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
      <RegisterTechnicianContentWrapper />
    </Suspense>
  );
}

function RegisterTechnicianContentWrapper() {
  const searchParams = useSearchParams();
  const isCompleteMode = searchParams.get('complete') === '1';

  return (
    <TechnicianRegisterLayout showLoginLink={!isCompleteMode}>
      <RegisterTechnicianContent />
    </TechnicianRegisterLayout>
  );
}

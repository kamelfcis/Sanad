'use client';

import { useAuthStore } from '@/store/auth-store';

export function AdminCustomerFlowPreviewNotice() {
  const { profile } = useAuthStore();
  if (profile?.role !== 'admin') return null;

  return (
    <div
      className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
      dir="rtl"
      role="status"
    >
      <p className="font-semibold">معاينة مسار العميل</p>
      <p className="mt-1 text-amber-900/90">
        أنت تستعرض نموذج العميل للتحقق من روابط مزود الخدمة. الإرسال يتطلب حساب عميل؛ هذا العرض للمراجعة فقط.
      </p>
    </div>
  );
}

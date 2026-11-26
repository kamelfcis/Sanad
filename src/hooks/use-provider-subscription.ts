'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { PROVIDER_SUBSCRIPTION_RECEIPTS_BUCKET } from '@/lib/constants/provider-subscription';

export interface ProviderSubscriptionPayment {
  id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface ProviderSubscriptionData {
  amount: number;
  verificationStatus: string | null;
  activeUntil: string | null;
  isActive: boolean;
  payments: ProviderSubscriptionPayment[];
  pendingPayment: ProviderSubscriptionPayment | null;
}

async function fetchProviderSubscription(): Promise<ProviderSubscriptionData> {
  const response = await fetch('/api/technician/subscription', { cache: 'no-store' });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error ?? 'تعذر تحميل حالة الاشتراك.');
  return result;
}

async function submitProviderSubscriptionPayment(receipt: File) {
  const initResponse = await fetch('/api/technician/subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName: receipt.name, mimeType: receipt.type, size: receipt.size }),
  });
  const upload = await initResponse.json().catch(() => ({}));
  if (!initResponse.ok) throw new Error(upload.error ?? 'تعذر تجهيز رفع الإيصال.');

  const supabase = createClient();
  const { error: uploadError } = await supabase.storage
    .from(PROVIDER_SUBSCRIPTION_RECEIPTS_BUCKET)
    .uploadToSignedUrl(upload.path, upload.token, receipt, {
      contentType: receipt.type,
      upsert: false,
    });

  if (uploadError) {
    await fetch('/api/technician/subscription', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: upload.path }),
    }).catch(() => undefined);
    throw new Error('فشل رفع الإيصال. تحقق من اتصال الإنترنت ثم حاول مرة أخرى.');
  }

  const response = await fetch('/api/technician/subscription', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: upload.path }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    await fetch('/api/technician/subscription', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: upload.path }),
    }).catch(() => undefined);
    throw new Error(result.error ?? 'تعذر تسجيل طلب الدفع.');
  }
  return result;
}

export function useProviderSubscription() {
  return useQuery({
    queryKey: ['provider-subscription'],
    queryFn: fetchProviderSubscription,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => query.state.data?.pendingPayment ? 10_000 : false,
  });
}

export function useSubmitProviderSubscriptionPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitProviderSubscriptionPayment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-subscription'] }),
  });
}

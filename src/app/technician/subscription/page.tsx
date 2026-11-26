import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { SubscriptionManagement } from '@/components/technician/subscription-management';

export const metadata: Metadata = pageMetadata(
  'اشتراك الظهور',
  'إدارة الاشتراك الشهري لظهور الفني أو المقاول على منصة سند.',
);

export default function TechnicianSubscriptionPage() {
  return (
    <div className="container py-8 sm:py-10">
      <SubscriptionManagement />
    </div>
  );
}

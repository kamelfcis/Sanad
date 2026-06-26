import { CustomerPaymentPageClient } from '@/components/payments/customer-payment-page-client';

export default async function CustomerBookingPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CustomerPaymentPageClient bookingId={id} />;
}

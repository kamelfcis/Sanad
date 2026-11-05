'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdminPayment, Payment, PaymentMethod, PaymentSettings } from '@/types/payments';

interface BookingPaymentResponse {
  payment: Payment | null;
  settings: PaymentSettings | null;
  booking: {
    id: string;
    price_quote: number | null;
    status: string;
    services?: { name_ar: string; name_en: string } | null;
  };
}

interface AdminPaymentsResponse {
  payments: AdminPayment[];
  total: number;
  page: number;
  limit: number;
}

async function fetchBookingPayment(bookingId: string): Promise<BookingPaymentResponse> {
  const res = await fetch(`/api/bookings/${bookingId}/payment`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Failed to fetch payment');
  }
  return res.json();
}

async function submitPayment(
  bookingId: string,
  data: { payment_method: PaymentMethod; screenshot_url: string; amount?: number },
): Promise<Payment> {
  const res = await fetch(`/api/bookings/${bookingId}/payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Failed to submit payment');
  }
  return res.json();
}

async function fetchAdminPayments(status?: string, page = 1): Promise<AdminPaymentsResponse> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  params.set('page', String(page));
  const res = await fetch(`/api/admin/payments?${params}`);
  if (!res.ok) throw new Error('Failed to fetch payments');
  return res.json();
}

async function approvePayment(paymentId: string): Promise<Payment> {
  const res = await fetch(`/api/admin/payments/${paymentId}/approve`, { method: 'PATCH' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Failed to approve payment');
  }
  return res.json();
}

async function rejectPayment(paymentId: string, rejection_reason: string): Promise<Payment> {
  const res = await fetch(`/api/admin/payments/${paymentId}/reject`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rejection_reason }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Failed to reject payment');
  }
  return res.json();
}

async function fetchPaymentSettings(): Promise<PaymentSettings> {
  const res = await fetch('/api/admin/payment-settings');
  if (!res.ok) throw new Error('Failed to fetch payment settings');
  return res.json();
}

async function updatePaymentSettings(data: Omit<PaymentSettings, 'id' | 'updated_at'>) {
  const res = await fetch('/api/admin/payment-settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Failed to update payment settings');
  }
  return res.json();
}

export function useBookingPayment(bookingId: string) {
  return useQuery({
    queryKey: ['booking-payment', bookingId],
    queryFn: () => fetchBookingPayment(bookingId),
    enabled: !!bookingId,
  });
}

export function useSubmitPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      ...data
    }: {
      bookingId: string;
      payment_method: PaymentMethod;
      screenshot_url: string;
      amount?: number;
    }) => submitPayment(bookingId, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['booking-payment', vars.bookingId] });
      qc.invalidateQueries({ queryKey: ['booking', vars.bookingId] });
      qc.invalidateQueries({ queryKey: ['admin-payments'] });
    },
  });
}

export function useAdminPayments(status?: string, page?: number) {
  return useQuery({
    queryKey: ['admin-payments', status, page],
    queryFn: () => fetchAdminPayments(status, page),
  });
}

export function useAdminApprovePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: approvePayment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-payments'] }),
  });
}

export function useAdminRejectPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentId, rejection_reason }: { paymentId: string; rejection_reason: string }) =>
      rejectPayment(paymentId, rejection_reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-payments'] }),
  });
}

export function usePaymentSettings() {
  return useQuery({
    queryKey: ['payment-settings'],
    queryFn: fetchPaymentSettings,
  });
}

export function useUpdatePaymentSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updatePaymentSettings,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment-settings'] }),
  });
}

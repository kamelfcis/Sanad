'use client';

import { useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { CreateBookingInput } from '@/lib/validations/booking';

export interface BookingTechnicianInfo {
  full_name: string | null;
  avatar_url: string | null;
}

export interface BookingTechnicianProfile {
  profile_photo_url: string | null;
}

export interface Booking {
  id: string;
  customer_id: string;
  service_id: string;
  technician_id: string | null;
  status: string;
  description: string | null;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  apartment_number: string | null;
  floor_number: string | null;
  preferred_time: string | null;
  price_quote: number | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  services: {
    name_ar: string;
    name_en: string;
    slug: string;
    price?: number | null;
  } | null;
  technician?: BookingTechnicianInfo | null;
  technician_profile?: BookingTechnicianProfile | null;
  booking_images?: { image_url: string }[];
  needs_manual_assignment?: boolean;
}

async function fetchBookings(status?: string): Promise<Booking[]> {
  const params = new URLSearchParams({ limit: '100', offset: '0' });
  if (status) params.set('status', status);

  const res = await fetch(`/api/bookings?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Failed to fetch bookings');
  }
  return res.json();
}

async function fetchBooking(id: string): Promise<Booking> {
  const res = await fetch(`/api/bookings/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 404 || res.status === 403) {
      throw new Error(err.error ?? 'Booking not found');
    }
    throw new Error(err.error ?? 'Failed to fetch booking');
  }
  return res.json();
}

async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Assignment can fail after the row exists — surface booking_id for recovery UX.
    const message = body.error ?? 'Failed to create booking';
    const error = new Error(message) as Error & { bookingId?: string };
    if (typeof body.booking_id === 'string') {
      error.bookingId = body.booking_id;
    }
    throw error;
  }

  return body as Booking;
}

export function useBookings(status?: string) {
  return useQuery({
    queryKey: ['bookings', status],
    queryFn: () => fetchBookings(status),
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: () => fetchBooking(id),
    enabled: !!id,
    retry: 1,
  });
}

/** Invalidate customer booking list + detail when Supabase reports booking row changes. */
export function useBookingsRealtime(customerId?: string) {
  const qc = useQueryClient();

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['bookings'] });
    qc.invalidateQueries({ queryKey: ['booking'] });
  }, [qc]);

  useEffect(() => {
    if (!customerId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`bookings-customer:${customerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `customer_id=eq.${customerId}`,
        },
        () => {
          invalidate();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [customerId, invalidate]);
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBooking,
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      if (booking?.id) {
        // Seed detail cache so the post-create redirect never flashes an empty fetch.
        queryClient.setQueryData(['booking', booking.id], booking);
      }
    },
  });
}

async function cancelBooking(id: string, reason?: string): Promise<Booking> {
  const res = await fetch(`/api/bookings/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'cancelled', ...(reason ? { reason } : {}) }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error ?? 'Failed to cancel booking');
  }
  return body as Booking;
}

async function confirmBookingCompletion(id: string): Promise<Booking> {
  const res = await fetch(`/api/bookings/${id}/confirm-completion`, { method: 'POST' });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error ?? 'Failed to confirm booking completion');
  }
  return body as Booking;
}

export function useConfirmBookingCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => confirmBookingCompletion(id),
    onSuccess: (booking) => {
      queryClient.setQueryData(['booking', booking.id], booking);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', booking.id] });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      cancelBooking(id, reason),
    onSuccess: (booking) => {
      queryClient.setQueryData(['booking', booking.id], booking);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', booking.id] });
    },
  });
}

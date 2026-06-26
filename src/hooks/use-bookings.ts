'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { CreateBookingInput } from '@/lib/validations/booking';

interface Booking {
  id: string;
  customer_id: string;
  service_id: string;
  technician_id: string | null;
  status: string;
  description: string | null;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  preferred_time: string | null;
  price_quote: number | null;
  created_at: string;
  updated_at: string;
  services: {
    name_ar: string;
    name_en: string;
    slug: string;
  } | null;
  booking_images?: { image_url: string }[];
}

async function fetchBookings(status?: string): Promise<Booking[]> {
  const supabase = createClient();
  let query = supabase
    .from('bookings')
    .select('*, services(name_ar, name_en, slug)')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function fetchBooking(id: string): Promise<Booking> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('*, services(*), booking_images(image_url)')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function createBooking(input: CreateBookingInput) {
  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? 'Failed to create booking');
  }

  return res.json();
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
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

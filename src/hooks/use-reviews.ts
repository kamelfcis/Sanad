'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Review {
  id: string;
  booking_id: string;
  customer_id: string;
  technician_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  customer: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface CreateReviewInput {
  booking_id: string;
  rating: number;
  comment?: string;
}

async function fetchTechnicianReviews(technicianId: string, limit = 50): Promise<Review[]> {
  const res = await fetch(`/api/reviews?technician_id=${encodeURIComponent(technicianId)}&limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch reviews');
  const json = await res.json();
  return json.reviews ?? json ?? []; // handle both paginated and legacy response
}

async function fetchBookingReview(bookingId: string): Promise<Review | null> {
  const res = await fetch(`/api/reviews/booking/${bookingId}`);
  if (!res.ok) throw new Error('Failed to fetch review');
  const data = await res.json();
  return data ?? null;
}

async function createReview(input: CreateReviewInput): Promise<Review> {
  const res = await fetch('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? 'Failed to create review');
  }
  return res.json();
}

export function useTechnicianReviews(technicianId: string) {
  return useQuery({
    queryKey: ['technician-reviews', technicianId],
    queryFn: () => fetchTechnicianReviews(technicianId),
    enabled: !!technicianId,
  });
}

export function useBookingReview(bookingId: string) {
  return useQuery({
    queryKey: ['booking-review', bookingId],
    queryFn: () => fetchBookingReview(bookingId),
    enabled: !!bookingId,
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createReview,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['booking-review', data.booking_id] });
      qc.invalidateQueries({ queryKey: ['technician-reviews', data.technician_id] });
      qc.invalidateQueries({ queryKey: ['technician-profile'] });
    },
  });
}

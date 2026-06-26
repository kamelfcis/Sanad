'use client';

import { useQuery } from '@tanstack/react-query';
import type { BrowseTechniciansResponse } from '@/types/technician-browse';
import type { browseTechniciansSortSchema } from '@/lib/validations/technicians';
import type { z } from 'zod';

export interface BrowseTechniciansFilters {
  search?: string;
  specialty?: string;
  category?: string;
  governorate?: string;
  sort?: z.infer<typeof browseTechniciansSortSchema>;
  maxPrice?: number;
  availableOnly?: boolean;
  lat?: number;
  lng?: number;
  page?: number;
  limit?: number;
}

async function fetchBrowseTechnicians(
  filters: BrowseTechniciansFilters,
): Promise<BrowseTechniciansResponse> {
  const params = new URLSearchParams();

  if (filters.search) params.set('search', filters.search);
  if (filters.specialty) params.set('specialty', filters.specialty);
  if (filters.category) params.set('category', filters.category);
  if (filters.governorate) params.set('governorate', filters.governorate);
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.maxPrice != null) params.set('maxPrice', String(filters.maxPrice));
  if (filters.availableOnly) params.set('availableOnly', 'true');
  if (filters.lat != null) params.set('lat', String(filters.lat));
  if (filters.lng != null) params.set('lng', String(filters.lng));
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  const query = params.toString();
  const res = await fetch(`/api/technicians/browse${query ? `?${query}` : ''}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'تعذّر تحميل الصنايعية');
  }

  return res.json();
}

export function useBrowseTechnicians(filters: BrowseTechniciansFilters) {
  return useQuery({
    queryKey: ['browse-technicians', filters],
    queryFn: () => fetchBrowseTechnicians(filters),
    staleTime: 60_000,
  });
}

async function fetchTechnicianPreview(technicianId: string): Promise<BrowseTechniciansResponse['technicians'][number]> {
  const res = await fetch(`/api/technicians/${technicianId}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'تعذّر تحميل بيانات الصنايعي');
  }

  return res.json();
}

export function useTechnicianPreview(technicianId?: string) {
  return useQuery({
    queryKey: ['technician-preview', technicianId],
    queryFn: () => fetchTechnicianPreview(technicianId!),
    enabled: !!technicianId,
    staleTime: 60_000,
  });
}

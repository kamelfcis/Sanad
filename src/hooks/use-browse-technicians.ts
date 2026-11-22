'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { BrowseTechniciansResponse } from '@/types/technician-browse';
import type { browseTechniciansSortSchema } from '@/lib/validations/technicians';
import type { z } from 'zod';

export interface BrowseTechniciansFilters {
  search?: string;
  specialty?: string;
  category?: string;
  providerRole?: string;
  contractorKind?: string;
  capacityTier?: string;
  teamSize?: number;
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
  if (filters.providerRole) params.set('providerRole', filters.providerRole);
  if (filters.contractorKind) params.set('contractorKind', filters.contractorKind);
  if (filters.capacityTier) params.set('capacityTier', filters.capacityTier);
  if (filters.teamSize) params.set('teamSize', String(filters.teamSize));
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

export function useBrowseTechnicians(
  filters: BrowseTechniciansFilters,
  initialData?: BrowseTechniciansResponse,
) {
  const isDefaultQuery =
    !filters.search &&
    !filters.specialty &&
    !filters.category &&
    !filters.providerRole &&
    !filters.contractorKind &&
    !filters.capacityTier &&
    filters.teamSize == null &&
    !filters.governorate &&
    (filters.page ?? 1) === 1 &&
    (filters.limit ?? 24) === 24 &&
    (filters.sort ?? 'rating') === 'rating' &&
    (filters.maxPrice ?? 500) === 500 &&
    !filters.availableOnly &&
    filters.lat == null &&
    filters.lng == null;

  return useQuery({
    queryKey: ['browse-technicians', filters],
    queryFn: () => fetchBrowseTechnicians(filters),
    staleTime: 60_000,
    initialData: isDefaultQuery && initialData ? initialData : undefined,
  });
}

/**
 * Subscribes to technician availability changes and patches every cached
 * browse query in place, so a technician toggling on/off flips their card
 * instantly without a refetch. Mount once alongside `useBrowseTechnicians`.
 */
export function useTechnicianAvailabilityRealtime(filters: BrowseTechniciansFilters) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('technician-availability-browse')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'technician_profiles',
        },
        (payload) => {
          const next = payload.new as { id?: string; is_available?: boolean };
          if (!next.id) return;

          queryClient.setQueriesData<BrowseTechniciansResponse>(
            { queryKey: ['browse-technicians'] },
            (old) => {
              if (!old) return old;
              const idx = old.technicians.findIndex((t) => t.id === next.id);
              if (idx === -1) return old;

              const technicians = [...old.technicians];
              technicians[idx] = { ...technicians[idx], is_available: Boolean(next.is_available) };
              return { ...old, technicians };
            },
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, filters]);
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

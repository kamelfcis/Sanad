'use client';

import { useQuery } from '@tanstack/react-query';

export interface Service {
  id: string;
  category_id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  description: string | null;
  price: number | null;
  price_type: 'fixed' | 'hourly' | 'estimate';
  service_categories: {
    name_ar: string;
    name_en: string;
    slug: string;
  };
}

async function fetchServices(categorySlug?: string): Promise<Service[]> {
  const params = new URLSearchParams();
  if (categorySlug) params.set('category', categorySlug);

  const query = params.toString();
  const res = await fetch(`/api/services${query ? `?${query}` : ''}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'تعذّر تحميل الخدمات');
  }

  return res.json();
}

async function fetchServiceById(serviceId: string): Promise<Service> {
  const res = await fetch(`/api/services?id=${encodeURIComponent(serviceId)}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'تعذّر تحميل الخدمة');
  }

  const data: Service[] = await res.json();
  const service = data[0];
  if (!service) {
    throw new Error('الخدمة غير موجودة');
  }

  return service;
}

export function formatServicePrice(price: number | string | null | undefined): string {
  if (price == null || price === '') return 'حسب المعاينة';
  const amount = typeof price === 'number' ? price : Number(price);
  return Number.isFinite(amount) ? `${Math.round(amount)} ج.م` : 'حسب المعاينة';
}

export function useServices(categorySlug?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['services', categorySlug],
    queryFn: () => fetchServices(categorySlug),
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
}

export function useService(serviceId?: string) {
  return useQuery({
    queryKey: ['service', serviceId],
    queryFn: () => fetchServiceById(serviceId!),
    enabled: !!serviceId,
    staleTime: 5 * 60 * 1000,
  });
}

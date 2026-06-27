'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ADMIN_ERROR_CODES as E } from '@/lib/i18n/admin/types';

// ---- Dashboard ----
export interface DashboardAnalytics {
  overview: {
    total_technicians: number;
    verified_technicians: number;
    pending_technicians: number;
    suspended_technicians: number;
    total_customers: number;
    total_bookings: number;
    completed_bookings: number;
    pending_bookings: number;
    in_progress_bookings: number;
    cancelled_bookings: number;
    total_reviews: number;
    hidden_reviews: number;
    average_rating: number;
    total_services: number;
    total_categories: number;
    pending_payments: number;
    approved_payments: number;
    total_audit_logs: number;
    hero_slides: number;
  };
  revenue: { total: number; by_month: { month: string; amount: number }[] };
  recent_bookings: {
    id: string;
    service_name: string;
    service_name_ar?: string;
    customer_name: string;
    status: string;
    created_at: string;
  }[];
  top_technicians: {
    id: string;
    full_name: string;
    completed_jobs: number;
    average_rating: number;
  }[];
  booking_trends: { date: string; count: number }[];
  recent_activity: {
    id: string;
    action: string;
    entity_type: string;
    admin_name: string;
    created_at: string;
  }[];
  shortcuts: {
    bookings: number;
    customers: number;
    technicians: number;
    services: number;
    categories: number;
    payments: number;
    pending_payments: number;
    reviews: number;
    audit_logs: number;
    hero_slides: number;
    settings: number;
  };
}

export const EMPTY_DASHBOARD: DashboardAnalytics = {
  overview: {
    total_technicians: 0,
    verified_technicians: 0,
    pending_technicians: 0,
    suspended_technicians: 0,
    total_customers: 0,
    total_bookings: 0,
    completed_bookings: 0,
    pending_bookings: 0,
    in_progress_bookings: 0,
    cancelled_bookings: 0,
    total_reviews: 0,
    hidden_reviews: 0,
    average_rating: 0,
    total_services: 0,
    total_categories: 0,
    pending_payments: 0,
    approved_payments: 0,
    total_audit_logs: 0,
    hero_slides: 0,
  },
  revenue: { total: 0, by_month: [] },
  recent_bookings: [],
  top_technicians: [],
  booking_trends: [],
  recent_activity: [],
  shortcuts: {
    bookings: 0,
    customers: 0,
    technicians: 0,
    services: 0,
    categories: 0,
    payments: 0,
    pending_payments: 0,
    reviews: 0,
    audit_logs: 0,
    hero_slides: 0,
    settings: 1,
  },
};

async function fetchDashboard(): Promise<DashboardAnalytics> {
  const res = await fetch('/api/admin/dashboard');
  if (!res.ok) throw new Error(E.FETCH_DASHBOARD_FAILED);
  const data = await res.json();
  if (!data?.overview) return EMPTY_DASHBOARD;
  return {
    overview: { ...EMPTY_DASHBOARD.overview, ...data.overview },
    revenue: {
      total: data.revenue?.total ?? 0,
      by_month: data.revenue?.by_month ?? [],
    },
    recent_bookings: data.recent_bookings ?? [],
    top_technicians: data.top_technicians ?? [],
    booking_trends: data.booking_trends ?? [],
    recent_activity: data.recent_activity ?? [],
    shortcuts: { ...EMPTY_DASHBOARD.shortcuts, ...data.shortcuts },
  };
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: fetchDashboard,
    refetchInterval: 30_000,
  });
}

// ---- Technicians ----
export interface AdminTechnicianListItem {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  verification_status: string;
  completed_jobs: number | null;
  average_rating: number | null;
  created_at: string | null;
  skills_count?: number;
}

export interface AdminTechnicianDetail {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  years_experience: number | null;
  verification_status: string;
  is_available: boolean;
  max_distance_km: number | null;
  completed_jobs: number;
  average_rating: number;
  total_ratings: number;
  created_at: string;
  bookings: Record<string, unknown>[];
  reviews: Record<string, unknown>[];
}

export interface AdminTechniciansResponse {
  technicians: AdminTechnicianListItem[];
  total: number;
  page: number;
  limit: number;
}

async function fetchTechnicians(search?: string, page = 1): Promise<AdminTechniciansResponse> {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  params.set('page', String(page));
  const res = await fetch(`/api/admin/technicians?${params}`);
  if (!res.ok) throw new Error(E.FETCH_TECHNICIANS_FAILED);
  return res.json();
}

async function fetchTechnician(id: string): Promise<AdminTechnicianDetail> {
  const res = await fetch(`/api/admin/technicians/${id}`);
  if (!res.ok) throw new Error(E.TECHNICIAN_NOT_FOUND);
  return res.json();
}

async function updateTechnicianStatus(technicianId: string, action: string, reason?: string) {
  const res = await fetch(`/api/admin/technicians/${technicianId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, reason }),
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? E.UPDATE_TECHNICIAN_STATUS_FAILED); }
  return res.json();
}

export function useAdminTechniciansList(search?: string, page?: number) {
  return useQuery({
    queryKey: ['admin-technicians-list', search, page],
    queryFn: () => fetchTechnicians(search, page),
  });
}

export function useAdminTechnician(id: string) {
  return useQuery({
    queryKey: ['admin-technician', id],
    queryFn: () => fetchTechnician(id),
    enabled: !!id,
  });
}

export function useAdminUpdateTechnicianStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ technicianId, action, reason }: { technicianId: string; action: string; reason?: string }) =>
      updateTechnicianStatus(technicianId, action, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-technicians-list'] });
      qc.invalidateQueries({ queryKey: ['admin-technician'] });
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });
}

// ---- Customers ----
export interface AdminCustomersResponse {
  customers: any[];
  total: number;
  page: number;
  limit: number;
}

async function fetchCustomers(search?: string, page = 1): Promise<AdminCustomersResponse> {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  params.set('page', String(page));
  const res = await fetch(`/api/admin/customers?${params}`);
  if (!res.ok) throw new Error(E.FETCH_CUSTOMERS_FAILED);
  return res.json();
}

export function useAdminCustomers(search?: string, page?: number) {
  return useQuery({
    queryKey: ['admin-customers', search, page],
    queryFn: () => fetchCustomers(search, page),
  });
}

async function fetchCustomer(id: string) {
  const res = await fetch(`/api/admin/customers/${id}`);
  if (!res.ok) throw new Error(E.CUSTOMER_NOT_FOUND);
  return res.json();
}

export function useAdminCustomer(id: string) {
  return useQuery({
    queryKey: ['admin-customer', id],
    queryFn: () => fetchCustomer(id),
    enabled: !!id,
  });
}

// ---- Services (Admin) ----
export interface AdminServicesResponse {
  services: any[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminServicesQueryFilters {
  categoryId?: string;
  search?: string;
  isActive?: 'true' | 'false';
  priceType?: string;
}

async function fetchAdminServices(
  page = 1,
  limit = 25,
  filters: AdminServicesQueryFilters = {},
): Promise<AdminServicesResponse> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (filters.categoryId) params.set('category_id', filters.categoryId);
  if (filters.search) params.set('search', filters.search);
  if (filters.isActive) params.set('is_active', filters.isActive);
  if (filters.priceType) params.set('price_type', filters.priceType);
  const res = await fetch(`/api/admin/services?${params}`);
  if (!res.ok) throw new Error(E.FETCH_SERVICES_FAILED);
  return res.json();
}

async function createAdminService(data: any) {
  const res = await fetch('/api/admin/services', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? E.CREATE_SERVICE_FAILED); }
  return res.json();
}

async function updateAdminService(id: string, data: any) {
  const res = await fetch(`/api/admin/services/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? E.UPDATE_SERVICE_FAILED); }
  return res.json();
}

async function deleteAdminService(id: string) {
  const res = await fetch(`/api/admin/services/${id}`, { method: 'DELETE' });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? E.DELETE_SERVICE_FAILED); }
  return res.json();
}

export function useAdminServices(
  page = 1,
  limit = 25,
  filters: AdminServicesQueryFilters = {},
) {
  return useQuery({
    queryKey: ['admin-services', page, limit, filters],
    queryFn: () => fetchAdminServices(page, limit, filters),
  });
}

export function useAdminCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAdminService,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-services'] }),
  });
}

export function useAdminUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateAdminService(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-services'] }),
  });
}

export function useAdminDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminService,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-services'] }),
  });
}

// ---- Categories (Admin) ----
export interface AdminCategoriesResponse {
  categories: any[];
  total: number;
  page: number;
  limit: number;
}

async function fetchAdminCategories(
  page = 1,
  limit = 25,
  search?: string,
): Promise<AdminCategoriesResponse> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (search) params.set('search', search);
  const res = await fetch(`/api/admin/categories?${params}`);
  if (!res.ok) throw new Error(E.FETCH_CATEGORIES_FAILED);
  return res.json();
}

async function createAdminCategory(data: any) {
  const res = await fetch('/api/admin/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? E.CREATE_CATEGORY_FAILED); }
  return res.json();
}

async function updateAdminCategory(id: string, data: any) {
  const res = await fetch(`/api/admin/categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? E.UPDATE_CATEGORY_FAILED); }
  return res.json();
}

async function deleteAdminCategory(id: string) {
  const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? E.DELETE_CATEGORY_FAILED); }
  return res.json();
}

export function useAdminCategories(page = 1, limit = 25, search?: string) {
  return useQuery({
    queryKey: ['admin-categories', page, limit, search],
    queryFn: () => fetchAdminCategories(page, limit, search),
  });
}

export function useAdminCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAdminCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-categories'] }),
  });
}

export function useAdminUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateAdminCategory(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-categories'] }),
  });
}

export function useAdminDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-categories'] }),
  });
}

// ---- Bookings (Admin) ----
export interface AdminBookingListItem {
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
  services: { name_ar: string; name_en: string; slug: string } | null;
  customer: { id: string; full_name: string | null; email: string } | null;
  technician: { id: string; full_name: string | null; email: string } | null;
}

export interface AdminBookingsResponse {
  bookings: AdminBookingListItem[];
  total: number;
  page: number;
  limit: number;
}

async function fetchAdminBookings(
  status?: string,
  page = 1,
  limit = 25,
): Promise<AdminBookingsResponse> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  params.set('page', String(page));
  params.set('limit', String(limit));
  const res = await fetch(`/api/admin/bookings?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? E.FETCH_BOOKINGS_FAILED);
  }
  return res.json();
}

async function fetchAdminBooking(id: string): Promise<AdminBookingListItem & {
  booking_images?: { image_url: string; image_type: string }[];
  services: Record<string, unknown> | null;
}> {
  const res = await fetch(`/api/admin/bookings/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? E.FETCH_BOOKING_FAILED);
  }
  return res.json();
}

export function useAdminBookings(status?: string, page = 1, limit = 25) {
  return useQuery({
    queryKey: ['admin-bookings', status, page, limit],
    queryFn: () => fetchAdminBookings(status, page, limit),
  });
}

export function useAdminBooking(id: string) {
  return useQuery({
    queryKey: ['admin-booking', id],
    queryFn: () => fetchAdminBooking(id),
    enabled: !!id,
  });
}

async function updateBookingStatus(bookingId: string, status: string, reason?: string) {
  const res = await fetch(`/api/admin/bookings/${bookingId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, reason }),
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? E.UPDATE_BOOKING_STATUS_FAILED); }
  return res.json();
}

export function useAdminUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, status, reason }: { bookingId: string; status: string; reason?: string }) =>
      updateBookingStatus(bookingId, status, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-booking'] });
      qc.invalidateQueries({ queryKey: ['admin-bookings'] });
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['booking'] });
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });
}

// ---- Reviews (Admin) ----
export interface AdminReviewsResponse {
  reviews: any[];
  total: number;
  page: number;
  limit: number;
}

async function fetchAdminReviews(hidden?: string, page = 1): Promise<AdminReviewsResponse> {
  const params = new URLSearchParams();
  if (hidden) params.set('hidden', hidden);
  params.set('page', String(page));
  const res = await fetch(`/api/admin/reviews?${params}`);
  if (!res.ok) throw new Error(E.FETCH_REVIEWS_FAILED);
  return res.json();
}

async function moderateReview(reviewId: string, action: 'hide' | 'restore', note?: string) {
  const res = await fetch(`/api/admin/reviews/${reviewId}/moderate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, note }),
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? E.MODERATE_REVIEW_FAILED); }
  return res.json();
}

export function useAdminReviews(hidden?: string, page?: number) {
  return useQuery({
    queryKey: ['admin-reviews', hidden, page],
    queryFn: () => fetchAdminReviews(hidden, page),
  });
}

export function useAdminModerateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, action, note }: { reviewId: string; action: 'hide' | 'restore'; note?: string }) =>
      moderateReview(reviewId, action, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-reviews'] }),
  });
}

// ---- Audit Logs ----
export interface AuditLogsResponse {
  logs: any[];
  total: number;
  page: number;
  limit: number;
}

async function fetchAuditLogs(entityType?: string, action?: string, page = 1): Promise<AuditLogsResponse> {
  const params = new URLSearchParams();
  if (entityType) params.set('entity_type', entityType);
  if (action) params.set('action', action);
  params.set('page', String(page));
  const res = await fetch(`/api/admin/audit-logs?${params}`);
  if (!res.ok) throw new Error(E.FETCH_AUDIT_LOGS_FAILED);
  return res.json();
}

export function useAdminAuditLogs(entityType?: string, action?: string, page?: number) {
  return useQuery({
    queryKey: ['admin-audit-logs', entityType, action, page],
    queryFn: () => fetchAuditLogs(entityType, action, page),
  });
}

// ---- Hero Slides (Admin) ----
async function fetchAdminHeroSlides() {
  const res = await fetch('/api/admin/hero-slides');
  if (!res.ok) throw new Error(E.FETCH_HERO_SLIDES_FAILED);
  return res.json();
}

async function createAdminHeroSlide(data: any) {
  const res = await fetch('/api/admin/hero-slides', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? E.CREATE_HERO_SLIDE_FAILED); }
  return res.json();
}

async function updateAdminHeroSlide(id: string, data: any) {
  const res = await fetch(`/api/admin/hero-slides/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? E.UPDATE_HERO_SLIDE_FAILED); }
  return res.json();
}

async function deleteAdminHeroSlide(id: string) {
  const res = await fetch(`/api/admin/hero-slides/${id}`, { method: 'DELETE' });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? E.DELETE_HERO_SLIDE_FAILED); }
  return res.json();
}

async function reorderAdminHeroSlides(orderedIds: string[]) {
  const res = await fetch('/api/admin/hero-slides', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ordered_ids: orderedIds }),
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? E.REORDER_HERO_SLIDES_FAILED); }
  return res.json();
}

export function useAdminHeroSlides() {
  return useQuery({
    queryKey: ['admin-hero-slides'],
    queryFn: fetchAdminHeroSlides,
  });
}

export function useAdminCreateHeroSlide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAdminHeroSlide,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-hero-slides'] });
      qc.invalidateQueries({ queryKey: ['hero-slides'] });
    },
  });
}

export function useAdminUpdateHeroSlide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateAdminHeroSlide(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-hero-slides'] });
      qc.invalidateQueries({ queryKey: ['hero-slides'] });
    },
  });
}

export function useAdminDeleteHeroSlide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminHeroSlide,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-hero-slides'] });
      qc.invalidateQueries({ queryKey: ['hero-slides'] });
    },
  });
}

export function useAdminReorderHeroSlides() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reorderAdminHeroSlides,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-hero-slides'] });
      qc.invalidateQueries({ queryKey: ['hero-slides'] });
    },
  });
}

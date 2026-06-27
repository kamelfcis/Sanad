'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { asAdminListItems } from '@/lib/admin/list-items';

interface TechProfile {
  id: string;
  bio: string | null;
  years_experience: number | null;
  national_id: string | null;
  governorate: string | null;
  profile_photo_url: string | null;
  id_card_photo_url: string | null;
  verification_status: string;
  verification_docs: string[] | null;
  id_document_url: string | null;
  license_url: string | null;
  is_available: boolean;
  max_distance_km: number | null;
  completed_jobs: number;
  average_rating: number;
  total_ratings: number;
}

interface TechSkill {
  id: string;
  technician_id: string;
  service_id: string;
  price_override: number | null;
  is_active: boolean;
  services: {
    name_ar: string;
    name_en: string;
    slug: string;
    price: number | null;
    price_type: string;
  } | null;
}

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
  created_at: string;
  services: { name_ar: string; name_en: string; slug: string; price: number | null; price_type: string } | null;
  profiles: { full_name: string | null; avatar_url: string | null; phone: string | null } | null;
}

async function fetchProfile(): Promise<TechProfile | null> {
  const res = await fetch('/api/technician/profile');
  if (res.status === 401) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Failed to load profile');
  }
  return res.json();
}

async function updateProfile(data: Partial<TechProfile & { phone?: string }>) {
  const res = await fetch('/api/technician/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? 'Failed to update profile');
  }
  return res.json();
}

async function fetchSkills(): Promise<TechSkill[]> {
  const res = await fetch('/api/technician/skills');
  if (res.status === 401) return [];
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Failed to load skills');
  }
  const data: TechSkill[] = await res.json();
  return data.filter((skill) => skill.is_active);
}

async function updateSkills(skills: { service_id: string; price_override?: number | null }[]) {
  const res = await fetch('/api/technician/skills', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ skills }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? 'Failed to update skills');
  }
  return res.json();
}

async function fetchTechnicianBookings(status?: string): Promise<Booking[]> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  const url = `/api/technician/bookings${params.toString() ? `?${params}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch bookings');
  return res.json();
}

export function useTechnicianProfile() {
  return useQuery({
    queryKey: ['technician-profile'],
    queryFn: fetchProfile,
  });
}

export function useUpdateTechnicianProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['technician-profile'] }),
  });
}

export function useTechnicianSkills() {
  return useQuery({
    queryKey: ['technician-skills'],
    queryFn: fetchSkills,
  });
}

export function useUpdateTechnicianSkills() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateSkills,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['technician-skills'] }),
  });
}

export function useTechnicianBookings(status?: string) {
  return useQuery({
    queryKey: ['technician-bookings', status],
    queryFn: () => fetchTechnicianBookings(status),
  });
}

// Assignment hooks
interface Assignment {
  id: string;
  booking_id: string;
  technician_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  response_at: string | null;
  created_at: string;
  booking: {
    id: string;
    customer_id: string;
    service_id: string;
    status: string;
    description: string | null;
    location_address: string | null;
    location_lat: number | null;
    location_lng: number | null;
    preferred_time: string | null;
    created_at: string;
    services: { name_ar: string; name_en: string; slug: string; price: number | null; price_type: string } | null;
    profiles: { full_name: string | null; avatar_url: string | null; phone: string | null } | null;
  };
}

async function fetchAssignments(status?: string): Promise<Assignment[]> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  const url = `/api/technician/assignments${params.toString() ? `?${params}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch assignments');
  return res.json();
}

async function fetchAssignment(id: string): Promise<Assignment> {
  const res = await fetch(`/api/technician/assignments/${id}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error('Assignment not found');
    throw new Error('Failed to fetch assignment');
  }
  return res.json();
}

async function respondToAssignment(id: string, action: 'accept' | 'reject') {
  const res = await fetch(`/api/technician/assignments/${id}/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? 'Failed to respond');
  }
  return res.json();
}

export function useTechnicianAssignments(status?: string) {
  return useQuery({
    queryKey: ['technician-assignments', status],
    queryFn: () => fetchAssignments(status),
  });
}

export function useTechnicianAssignment(id: string) {
  return useQuery({
    queryKey: ['technician-assignment', id],
    queryFn: () => fetchAssignment(id),
    enabled: !!id,
  });
}

export function useRespondToAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'accept' | 'reject' }) =>
      respondToAssignment(id, action),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['technician-assignments'] });
      qc.invalidateQueries({ queryKey: ['technician-bookings'] });
      qc.invalidateQueries({ queryKey: ['booking'] });
    },
  });
}

// Admin hooks
interface AdminTechnician {
  id: string;
  bio: string | null;
  years_experience: number | null;
  verification_status: string;
  is_available: boolean;
  max_distance_km: number | null;
  completed_jobs: number;
  average_rating: number;
  total_ratings: number;
  skills_count: number;
  profile: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
  };
}

type AdminTechniciansApiRow = Omit<AdminTechnician, 'profile'> & {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  profile?: AdminTechnician['profile'];
};

async function fetchAdminTechnicians(): Promise<AdminTechnician[]> {
  const params = new URLSearchParams({ limit: '100', status: 'verified' });
  const res = await fetch(`/api/admin/technicians?${params}`);
  if (!res.ok) throw new Error('Failed to fetch technicians');

  const data = await res.json();
  const rows = asAdminListItems<AdminTechniciansApiRow, 'technicians'>(data, 'technicians');

  return rows.map((row) => ({
    id: row.id,
    bio: row.bio,
    years_experience: row.years_experience,
    verification_status: row.verification_status,
    is_available: row.is_available,
    max_distance_km: row.max_distance_km,
    completed_jobs: row.completed_jobs,
    average_rating: row.average_rating,
    total_ratings: row.total_ratings,
    skills_count: row.skills_count,
    profile:
      row.profile ??
      ({
        id: row.id,
        full_name: row.full_name ?? null,
        email: row.email ?? null,
        phone: row.phone ?? null,
        avatar_url: row.avatar_url ?? null,
      } satisfies AdminTechnician['profile']),
  }));
}

async function adminAssignTechnician(bookingId: string, technicianId: string) {
  const res = await fetch(`/api/admin/bookings/${bookingId}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ technician_id: technicianId }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? 'Failed to assign technician');
  }
  return res.json();
}

export function useAdminTechnicians() {
  return useQuery({
    queryKey: ['admin-technicians'],
    queryFn: fetchAdminTechnicians,
  });
}

export function useAdminAssignTechnician() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, technicianId }: { bookingId: string; technicianId: string }) =>
      adminAssignTechnician(bookingId, technicianId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['booking'] });
      qc.invalidateQueries({ queryKey: ['admin-technicians'] });
    },
  });
}

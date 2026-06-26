export type TechnicianBrowseBadge = 'verified' | 'high_rating' | 'fast_response' | 'available';

export interface BrowseTechnician {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  specialty_label: string;
  specialty_slug: string | null;
  area: string | null;
  governorate: string | null;
  verification_status: string;
  is_available: boolean;
  average_rating: number;
  completed_jobs: number;
  starting_price: number;
  distance_km: number;
  location_lat: number | null;
  location_lng: number | null;
  response_time_minutes: number;
  badges: TechnicianBrowseBadge[];
  primary_service_id: string | null;
}

export interface BrowseTechniciansResponse {
  technicians: BrowseTechnician[];
  total: number;
  page: number;
  limit: number;
}

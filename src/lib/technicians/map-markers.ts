import type { GeoPoint } from '@/lib/geo';
import type { BrowseTechnician } from '@/types/technician-browse';

export interface TechnicianMapMarker {
  id: string;
  name: string;
  specialty: string;
  position: GeoPoint;
  distanceKm?: number;
  bookingHref?: string;
}

export function toTechnicianMapMarkers(technicians: BrowseTechnician[]): TechnicianMapMarker[] {
  return technicians
    .filter((tech) => tech.location_lat != null && tech.location_lng != null)
    .map((tech) => ({
      id: tech.id,
      name: tech.full_name ?? 'صنايعي',
      specialty: tech.specialty_label,
      position: { lat: tech.location_lat!, lng: tech.location_lng! },
      distanceKm: tech.distance_km,
      bookingHref: tech.primary_service_id
        ? `/customer/bookings/new?service_id=${tech.primary_service_id}`
        : '/customer/bookings/new',
    }));
}

export const toMarkers = toTechnicianMapMarkers;

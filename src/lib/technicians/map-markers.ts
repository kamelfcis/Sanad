import type { GeoPoint } from '@/lib/geo';
import { buildNewBookingHref } from '@/lib/booking/booking-links';
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
      bookingHref: buildNewBookingHref({
        serviceId: tech.primary_service_id,
        technicianId: tech.id,
      }),
    }));
}

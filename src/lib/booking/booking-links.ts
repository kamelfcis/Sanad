/** Build `/customer/bookings/new` URL with optional service + technician pre-selection. */
export function buildNewBookingHref(options: {
  serviceId?: string | null;
  technicianId?: string | null;
}): string {
  const params = new URLSearchParams();
  if (options.serviceId) params.set('service_id', options.serviceId);
  if (options.technicianId) params.set('technician_id', options.technicianId);
  const qs = params.toString();
  return qs ? `/customer/bookings/new?${qs}` : '/customer/bookings/new';
}

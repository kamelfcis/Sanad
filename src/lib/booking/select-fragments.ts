/** PostgREST nested select for booking rows with customer profile join. */
export const BOOKING_WITH_CUSTOMER_PROFILE_SELECT = `
  *,
  services(name_ar, name_en, slug, price, price_type),
  profiles:profiles!bookings_customer_id_fkey(full_name, avatar_url, phone)
`;

/** Assignment detail view — includes category and booking images. */
export const BOOKING_ASSIGNMENT_DETAIL_SELECT = `
  *,
  services(name_ar, name_en, slug, price, price_type, service_categories(name_ar, name_en)),
  profiles:profiles!bookings_customer_id_fkey(full_name, avatar_url, phone),
  booking_images(image_url)
`;

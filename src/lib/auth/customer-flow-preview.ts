/** Customer quote/booking entry points admins may open to verify provider contact links. */
export const ADMIN_CUSTOMER_FLOW_PREVIEW_PREFIXES = [
  '/customer/quotes/new',
  '/customer/bookings/new',
] as const;

export function isAdminCustomerFlowPreviewPath(pathname: string): boolean {
  return ADMIN_CUSTOMER_FLOW_PREVIEW_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

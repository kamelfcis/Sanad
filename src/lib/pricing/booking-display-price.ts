export function getBookingDisplayPrice(
  priceQuote: number | null | undefined,
  servicePrice: number | null | undefined,
): number | null {
  if (priceQuote != null && Number(priceQuote) > 0) return Number(priceQuote);
  if (servicePrice != null && Number(servicePrice) > 0) return Number(servicePrice);
  return null;
}

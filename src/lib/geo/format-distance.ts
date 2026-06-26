/** Arabic-friendly distance label (e.g. "٣.٥ كم" or "٨٠٠ م"). */
export function formatDistanceKm(km: number): string {
  if (!Number.isFinite(km) || km < 0) return '—';

  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters.toLocaleString('ar-EG')} م`;
  }

  const rounded = km < 10 ? Math.round(km * 10) / 10 : Math.round(km);
  return `${rounded.toLocaleString('ar-EG')} كم`;
}

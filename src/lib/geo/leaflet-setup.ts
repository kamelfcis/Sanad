import L from 'leaflet';
import type { StaticImageData } from 'next/image';
import markerIcon2xImport from 'leaflet/dist/images/marker-icon-2x.png';
import markerIconImport from 'leaflet/dist/images/marker-icon.png';
import markerShadowImport from 'leaflet/dist/images/marker-shadow.png';

const PUBLIC_FALLBACK = {
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  shadowUrl: '/leaflet/marker-shadow.png',
} as const;

let configured = false;
let defaultLeafletIcon: L.Icon | undefined;

/** Accept bundled image imports (string or StaticImageData) for marker assets. */
export function resolveLeafletAssetUrl(
  asset: string | StaticImageData | { src?: string },
): string {
  if (typeof asset === 'string') return asset;
  if (asset && typeof asset === 'object' && 'src' in asset && typeof asset.src === 'string') {
    return asset.src;
  }
  return '';
}

function assetUrlOrFallback(
  imported: string | StaticImageData,
  fallback: string,
): string {
  return resolveLeafletAssetUrl(imported) || fallback;
}

function buildDefaultIcon(): L.Icon {
  return L.icon({
    iconRetinaUrl: assetUrlOrFallback(markerIcon2xImport, PUBLIC_FALLBACK.iconRetinaUrl),
    iconUrl: assetUrlOrFallback(markerIconImport, PUBLIC_FALLBACK.iconUrl),
    shadowUrl: assetUrlOrFallback(markerShadowImport, PUBLIC_FALLBACK.shadowUrl),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
}

/** Shared default marker icon for explicit Marker `icon` props. */
export function getDefaultLeafletIcon(): L.Icon | undefined {
  if (typeof window === 'undefined') return undefined;
  configureLeafletIcons();
  return defaultLeafletIcon;
}

/** Fix default marker icons broken by bundlers (Next.js / webpack). Call before first Marker. */
export function configureLeafletIcons(): void {
  if (configured || typeof window === 'undefined') return;

  defaultLeafletIcon = buildDefaultIcon();
  L.Marker.prototype.options.icon = defaultLeafletIcon;
  configured = true;
}

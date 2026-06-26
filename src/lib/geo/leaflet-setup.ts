import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let configured = false;

function assetUrl(asset: string | { src: string }): string {
  return typeof asset === 'string' ? asset : asset.src;
}

/** Fix default marker icons broken by bundlers (Next.js / webpack). */
export function configureLeafletIcons(): void {
  if (configured || typeof window === 'undefined') return;

  const icon = L.icon({
    iconRetinaUrl: assetUrl(markerIcon2x),
    iconUrl: assetUrl(markerIcon),
    shadowUrl: assetUrl(markerShadow),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  L.Marker.prototype.options.icon = icon;
  configured = true;
}

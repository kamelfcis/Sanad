'use client';

import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { configureLeafletIcons, getDefaultLeafletIcon } from '@/lib/geo/leaflet-setup';
import type { GeoPoint } from '@/lib/geo';

export interface LocationMapInnerProps {
  position: GeoPoint;
  label?: string;
  zoom?: number;
  className?: string;
}

export function LocationMapInner({
  position,
  label,
  zoom = 15,
  className,
}: LocationMapInnerProps) {
  configureLeafletIcons();
  const markerIcon = getDefaultLeafletIcon();

  if (!markerIcon) return null;

  const lat = Number(position.lat);
  const lng = Number(position.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return (
    <div
      dir="ltr"
      className={className ?? 'h-[240px] w-full overflow-hidden rounded-xl border border-border'}
    >
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        scrollWheelZoom={false}
        className="h-full w-full"
        aria-label={label ?? 'موقع على الخريطة'}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={markerIcon}>
          {label ? <Popup>{label}</Popup> : null}
        </Marker>
      </MapContainer>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { configureLeafletIcons } from '@/lib/geo/leaflet-setup';
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

  return (
    <div className={className ?? 'h-[240px] w-full overflow-hidden rounded-xl border border-border'}>
      <MapContainer
        center={[position.lat, position.lng]}
        zoom={zoom}
        scrollWheelZoom={false}
        className="h-full w-full"
        aria-label={label ?? 'موقع على الخريطة'}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[position.lat, position.lng]}>
          {label ? <Popup>{label}</Popup> : null}
        </Marker>
      </MapContainer>
    </div>
  );
}

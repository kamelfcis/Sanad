'use client';

import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { configureLeafletIcons } from '@/lib/geo/leaflet-setup';
import type { GeoPoint } from '@/lib/geo';

interface MapClickHandlerProps {
  onChange: (point: GeoPoint) => void;
}

function MapClickHandler({ onChange }: MapClickHandlerProps) {
  useMapEvents({
    click(event) {
      onChange({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

interface RecenterProps {
  center: GeoPoint;
}

function RecenterMap({ center }: RecenterProps) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom());
  }, [center.lat, center.lng, map]);
  return null;
}

export interface MapPickerInnerProps {
  value: GeoPoint;
  onChange: (point: GeoPoint) => void;
  zoom?: number;
  className?: string;
}

export function MapPickerInner({ value, onChange, zoom = 13, className }: MapPickerInnerProps) {
  configureLeafletIcons();

  return (
    <div className={className ?? 'h-[280px] w-full overflow-hidden rounded-xl border border-border'}>
      <MapContainer
        center={[value.lat, value.lng]}
        zoom={zoom}
        scrollWheelZoom
        className="h-full w-full"
        aria-label="اختر موقع الخدمة على الخريطة"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap center={value} />
        <MapClickHandler onChange={onChange} />
        <Marker
          draggable
          position={[value.lat, value.lng]}
          eventHandlers={{
            dragend: (event) => {
              const marker = event.target;
              const pos = marker.getLatLng();
              onChange({ lat: pos.lat, lng: pos.lng });
            },
          }}
        />
      </MapContainer>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { configureLeafletIcons, getDefaultLeafletIcon } from '@/lib/geo/leaflet-setup';
import { CAIRO_DEFAULT, type GeoPoint } from '@/lib/geo';

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
  zoom: number;
}

function RecenterMap({ center, zoom }: RecenterProps) {
  const map = useMap();
  useEffect(() => {
    const current = map.getZoom();
    const nextZoom = !Number.isFinite(current) || current < 6 ? zoom : current;
    map.setView([center.lat, center.lng], nextZoom);
  }, [center.lat, center.lng, map, zoom]);
  return null;
}

export interface MapPickerInnerProps {
  value: GeoPoint;
  onChange: (point: GeoPoint) => void;
  zoom?: number;
  className?: string;
}

export function MapPickerInner({ value, onChange, zoom = 12, className }: MapPickerInnerProps) {
  configureLeafletIcons();
  const markerIcon = getDefaultLeafletIcon();

  if (!markerIcon) return null;

  const center =
    Number.isFinite(value.lat) && Number.isFinite(value.lng) ? value : CAIRO_DEFAULT;

  return (
    <div
      dir="ltr"
      className={className ?? 'h-[280px] w-full overflow-hidden rounded-xl border border-border'}
    >
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        scrollWheelZoom
        className="h-full w-full"
        aria-label="اختر موقع الخدمة على الخريطة"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap center={center} zoom={zoom} />
        <MapClickHandler onChange={onChange} />
        <Marker
          draggable
          icon={markerIcon}
          position={[center.lat, center.lng]}
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

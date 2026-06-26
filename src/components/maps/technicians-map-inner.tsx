'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { configureLeafletIcons } from '@/lib/geo/leaflet-setup';
import { formatDistanceKm } from '@/lib/geo';
import type { GeoPoint } from '@/lib/geo';
import type { TechnicianMapMarker } from '@/lib/technicians/map-markers';
import { Button } from '@/components/ui/button';

export type { TechnicianMapMarker };

export interface TechniciansMapInnerProps {
  technicians: TechnicianMapMarker[];
  center: GeoPoint;
  zoom?: number;
  className?: string;
}


function FitBounds({ bounds }: { bounds: [[number, number], [number, number]] | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [40, 40] });
  }, [bounds, map]);
  return null;
}

export function TechniciansMapInner({
  technicians,
  center,
  zoom = 11,
  className,
}: TechniciansMapInnerProps) {
  configureLeafletIcons();

  const bounds = useMemo(() => {
    if (technicians.length === 0) return null;
    const lats = technicians.map((t) => t.position.lat);
    const lngs = technicians.map((t) => t.position.lng);
    return [
      [Math.min(...lats, center.lat), Math.min(...lngs, center.lng)],
      [Math.max(...lats, center.lat), Math.max(...lngs, center.lng)],
    ] as [[number, number], [number, number]];
  }, [technicians, center]);

  return (
    <div className={className ?? 'h-[480px] w-full overflow-hidden rounded-2xl border border-border'}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        scrollWheelZoom
        className="h-full w-full"
        aria-label="خريطة الصنايعية"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds bounds={bounds} />
        {technicians.map((tech) => (
          <Marker key={tech.id} position={[tech.position.lat, tech.position.lng]}>
            <Popup>
              <div className="min-w-[160px] text-right" dir="rtl">
                <p className="font-bold text-text-primary">{tech.name}</p>
                <p className="text-sm text-text-secondary">{tech.specialty}</p>
                {tech.distanceKm != null && (
                  <p className="mt-1 text-xs text-text-muted">
                    {formatDistanceKm(tech.distanceKm)} من موقعك
                  </p>
                )}
                {tech.bookingHref && (
                  <Button asChild size="sm" className="mt-2 w-full">
                    <Link href={tech.bookingHref}>احجز مع هذا الفني</Link>
                  </Button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

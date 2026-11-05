'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { TechnicianMapMarker } from '@/lib/technicians/map-markers';

export type { TechnicianMapMarker };
export { toMarkers } from '@/lib/technicians/map-markers';

export interface TechniciansMapProps {
  technicians: TechnicianMapMarker[];
  center: import('@/lib/geo').GeoPoint;
  zoom?: number;
  className?: string;
}

export const TechniciansMap = dynamic(
  () => import('@/components/maps/technicians-map-inner').then((mod) => mod.TechniciansMapInner),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[480px] w-full rounded-2xl" />,
  },
);

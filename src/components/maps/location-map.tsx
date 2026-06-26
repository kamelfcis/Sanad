'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { LocationMapInnerProps } from '@/components/maps/location-map-inner';

export type LocationMapProps = LocationMapInnerProps;

export const LocationMap = dynamic(
  () => import('@/components/maps/location-map-inner').then((mod) => mod.LocationMapInner),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[240px] w-full rounded-xl" />,
  },
);

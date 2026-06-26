'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { TechniciansMapInnerProps } from '@/components/maps/technicians-map-inner';

export type TechniciansMapProps = TechniciansMapInnerProps;

export const TechniciansMap = dynamic(
  () => import('@/components/maps/technicians-map-inner').then((mod) => mod.TechniciansMapInner),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[480px] w-full rounded-2xl" />,
  },
);

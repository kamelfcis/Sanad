'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { MapPickerInnerProps } from '@/components/maps/map-picker-inner';

export type MapPickerProps = MapPickerInnerProps;

export const MapPicker = dynamic(
  () => import('@/components/maps/map-picker-inner').then((mod) => mod.MapPickerInner),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[280px] w-full rounded-xl" />,
  },
);

'use client';

import { useCallback, useEffect, useState } from 'react';
import { CAIRO_DEFAULT, type GeoPoint } from '@/lib/geo';

export interface UserLocationState {
  location: GeoPoint;
  loading: boolean;
  error: string | null;
  isFallback: boolean;
  permission: PermissionState | 'unsupported' | null;
  refresh: () => void;
}

function requestBrowserLocation(
  onSuccess: (point: GeoPoint) => void,
  onFailure: (message: string) => void,
  onUnsupported: () => void,
): void {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    onUnsupported();
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      onSuccess({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    },
    (geoError) => {
      onFailure(
        geoError.code === geoError.PERMISSION_DENIED
          ? 'تم رفض إذن الموقع — نستخدم القاهرة كموقع افتراضي'
          : 'تعذّر تحديد موقعك — نستخدم القاهرة كموقع افتراضي',
      );
    },
    { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
  );
}

export function useUserLocation(): UserLocationState {
  const [location, setLocation] = useState<GeoPoint>(CAIRO_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(true);
  const [permission, setPermission] = useState<PermissionState | 'unsupported' | null>(null);

  const applySuccess = useCallback((point: GeoPoint) => {
    setLocation(point);
    setIsFallback(false);
    setLoading(false);
    setError(null);
  }, []);

  const applyFailure = useCallback((message: string) => {
    setLocation(CAIRO_DEFAULT);
    setIsFallback(true);
    setLoading(false);
    setError(message);
  }, []);

  const applyUnsupported = useCallback(() => {
    setLocation(CAIRO_DEFAULT);
    setIsFallback(true);
    setLoading(false);
    setPermission('unsupported');
    setError('المتصفح لا يدعم تحديد الموقع');
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    requestBrowserLocation(applySuccess, applyFailure, applyUnsupported);
  }, [applyFailure, applySuccess, applyUnsupported]);

  useEffect(() => {
    requestBrowserLocation(applySuccess, applyFailure, applyUnsupported);

    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          setPermission(result.state);
          result.onchange = () => setPermission(result.state);
        })
        .catch(() => setPermission(null));
    }
  }, [applyFailure, applySuccess, applyUnsupported]);

  return {
    location,
    loading,
    error,
    isFallback,
    permission,
    refresh,
  };
}

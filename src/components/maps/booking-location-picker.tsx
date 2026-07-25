'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, MapPin, LocateFixed } from 'lucide-react';
import { MapPicker } from '@/components/maps/map-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CAIRO_DEFAULT, type GeoPoint } from '@/lib/geo';
import { reverseGeocode } from '@/lib/geo/geocode';

export interface BookingLocationPickerProps {
  address: string;
  lat?: number;
  lng?: number;
  apartmentNumber: string;
  floorNumber: string;
  onAddressChange: (address: string) => void;
  onCoordsChange: (coords: { lat: number; lng: number }) => void;
  onApartmentChange: (value: string) => void;
  onFloorChange: (value: string) => void;
  error?: string;
}

type GpsState = 'idle' | 'loading' | 'denied' | 'unavailable' | 'done';

export function BookingLocationPicker({
  address,
  lat,
  lng,
  apartmentNumber,
  floorNumber,
  onAddressChange,
  onCoordsChange,
  onApartmentChange,
  onFloorChange,
  error,
}: BookingLocationPickerProps) {
  const [mapCenter, setMapCenter] = useState<GeoPoint>({
    lat: lat ?? CAIRO_DEFAULT.lat,
    lng: lng ?? CAIRO_DEFAULT.lng,
  });
  const [geocoding, setGeocoding] = useState(false);
  const [gpsState, setGpsState] = useState<GpsState>('idle');

  const handleMapChange = useCallback(
    async (point: GeoPoint) => {
      setMapCenter(point);
      onCoordsChange({ lat: point.lat, lng: point.lng });
      setGeocoding(true);
      const resolved = await reverseGeocode(point.lat, point.lng);
      if (resolved) onAddressChange(resolved);
      setGeocoding(false);
    },
    [onAddressChange, onCoordsChange],
  );

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsState('unavailable');
      return;
    }
    setGpsState('loading');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setMapCenter({ lat, lng });
        onCoordsChange({ lat, lng });
        setGpsState('done');
        setGeocoding(true);
        const resolved = await reverseGeocode(lat, lng);
        if (resolved) onAddressChange(resolved);
        setGeocoding(false);
      },
      () => setGpsState('denied'),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }, [onAddressChange, onCoordsChange]);

  // Auto-trigger GPS once on mount so the map centers on the customer.
  // locateMe sets state synchronously; that is intentional for a one-time
  // mount trigger, so both hook rules are suppressed here.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    locateMe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="space-y-3" dir="rtl">
      <Label htmlFor="location_address">موقع الخدمة</Label>

      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={locateMe}
          disabled={gpsState === 'loading'}
          className="flex min-h-[44px] items-center gap-2"
        >
          {gpsState === 'loading' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LocateFixed className="h-4 w-4" />
          )}
          {gpsState === 'loading' ? 'جاري تحديد موقعك...' : 'تحديد موقعي'}
        </Button>

        {gpsState === 'denied' && (
          <p className="mt-2 text-xs text-amber-600">
            لم يتم السماح بالوصول إلى موقعك. يمكنك تحديد موقعك يدوياً على الخريطة.
          </p>
        )}
        {gpsState === 'unavailable' && (
          <p className="mt-2 text-xs text-amber-600">
            متصفحك لا يدعم تحديد الموقع. حدد موقعك على الخريطة يدوياً.
          </p>
        )}
      </div>

      <MapPicker value={mapCenter} onChange={(point) => void handleMapChange(point)} />

      <div className="relative">
        <MapPin className="absolute right-3 top-3 h-4 w-4 text-text-muted" />
        <Input
          id="location_address"
          value={address}
          onChange={(event) => onAddressChange(event.target.value)}
          placeholder="العنوان التفصيلي..."
          className="min-h-[44px] pr-10"
        />
        {geocoding && <p className="mt-1 text-xs text-text-muted">جاري تحديد العنوان...</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="apartment_number">رقم الشقة</Label>
          <Input
            id="apartment_number"
            value={apartmentNumber}
            onChange={(e) => onApartmentChange(e.target.value)}
            placeholder="مثال: 3"
            maxLength={20}
            className="mt-1 min-h-[44px]"
          />
        </div>
        <div>
          <Label htmlFor="floor_number">الدور</Label>
          <Input
            id="floor_number"
            value={floorNumber}
            onChange={(e) => onFloorChange(e.target.value)}
            placeholder="مثال: الثاني"
            maxLength={20}
            className="mt-1 min-h-[44px]"
          />
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-xs text-text-muted">
        اضغط على الخريطة أو اسحب العلامة لتحديد موقع الخدمة بدقة.
      </p>
    </div>
  );
}

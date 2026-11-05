'use client';

import { useCallback, useState } from 'react';
import { Loader2, MapPin, Search } from 'lucide-react';
import { MapPicker } from '@/components/maps/map-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CAIRO_DEFAULT, type GeoPoint } from '@/lib/geo';
import { reverseGeocode, searchAddress } from '@/lib/geo/geocode';

export interface BookingLocationPickerProps {
  address: string;
  lat?: number;
  lng?: number;
  onAddressChange: (address: string) => void;
  onCoordsChange: (coords: { lat: number; lng: number }) => void;
  error?: string;
}

export function BookingLocationPicker({
  address,
  lat,
  lng,
  onAddressChange,
  onCoordsChange,
  error,
}: BookingLocationPickerProps) {
  const [mapCenter, setMapCenter] = useState<GeoPoint>({
    lat: lat ?? CAIRO_DEFAULT.lat,
    lng: lng ?? CAIRO_DEFAULT.lng,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

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

  const handleSearch = async () => {
    if (searchQuery.trim().length < 3) return;
    setSearching(true);
    const results = await searchAddress(searchQuery);
    setSearching(false);
    const first = results[0];
    if (!first) return;
    setMapCenter({ lat: first.lat, lng: first.lng });
    onCoordsChange({ lat: first.lat, lng: first.lng });
    onAddressChange(first.address);
  };

  return (
    <div className="space-y-3" dir="rtl">
      <Label htmlFor="location_address">موقع الخدمة</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            id="location_search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void handleSearch();
              }
            }}
            placeholder="ابحث عن عنوان..."
            className="pr-10"
          />
        </div>
        <Button type="button" variant="outline" onClick={() => void handleSearch()} disabled={searching}>
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'بحث'}
        </Button>
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
        {geocoding && (
          <p className="mt-1 text-xs text-text-muted">جاري تحديد العنوان...</p>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-xs text-text-muted">
        اضغط على الخريطة أو اسحب العلامة لتحديد موقع الخدمة بدقة.
      </p>
    </div>
  );
}

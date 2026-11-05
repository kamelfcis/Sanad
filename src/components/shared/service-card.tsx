'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { formatMoney } from '@/lib/currency/format';

interface ServiceCardProps {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  description: string | null;
  price: number | null;
  price_type: 'fixed' | 'hourly' | 'estimate';
}

export function ServiceCard({
  id,
  name_ar,
  name_en,
  description,
  price,
  price_type,
}: ServiceCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-4">
        <div className="min-w-0">
          <h3 className="font-semibold" dir="auto">
            {name_ar}
          </h3>
          <p className="text-sm text-muted-foreground">{name_en}</p>
          {description ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <div className="shrink-0 text-left">
          {price != null ? (
            <p className="font-bold text-primary">
              {formatMoney(price)}
              {price_type === 'hourly' ? ' / ساعة' : ''}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">حسب المعاينة</p>
          )}
          <Link
            href={`/customer/bookings/new?service_id=${id}`}
            className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
          >
            احجز الآن
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

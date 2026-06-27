'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench } from 'lucide-react';
import { useFormatMoney } from '@/hooks/use-site-settings';

interface ServiceCardProps {
  name_ar: string;
  name_en: string;
  description: string | null;
  price: number | null;
  price_type: 'fixed' | 'hourly' | 'estimate';
}

const priceTypeLabels: Record<string, string> = {
  fixed: 'Fixed price',
  hourly: 'Per hour',
  estimate: 'Upon estimate',
};

export function ServiceCard({ name_ar, name_en, description, price, price_type }: ServiceCardProps) {
  const { formatMoneyOrEstimate } = useFormatMoney();

  return (
    <Card className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm">
      <CardContent className="flex items-start gap-4 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Wrench className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-medium" dir="auto">
                {name_ar}
              </h3>
              <p className="text-xs text-muted-foreground">{name_en}</p>
            </div>
            {price != null && price > 0 && (
              <div className="shrink-0 text-right">
                <p className="font-semibold">{formatMoneyOrEstimate(price)}</p>
              </div>
            )}
          </div>
          {description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>
          )}
          <Badge variant="secondary" className="text-xs">
            {priceTypeLabels[price_type]}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

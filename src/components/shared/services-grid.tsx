'use client';

import { ServiceCard } from '@/components/shared/service-card';
import { EmptyState } from '@/components/shared/empty-state';
import { PageLoading } from '@/components/shared/page-loading';
import { PackageOpen } from 'lucide-react';

interface Service {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  description: string | null;
  price: number | null;
  price_type: 'fixed' | 'hourly' | 'estimate';
}

interface ServicesGridProps {
  services: Service[] | undefined;
  isLoading: boolean;
}

export function ServicesGrid({ services, isLoading }: ServicesGridProps) {
  if (isLoading) {
    return <PageLoading variant="list" />;
  }

  if (!services?.length) {
    return (
      <EmptyState
        icon={PackageOpen}
        title="لا توجد خدمات"
        description="جرّب اختيار فئة مختلفة أو تعديل البحث."
      />
    );
  }

  return (
    <div className="space-y-3">
      {services.map((service) => (
        <ServiceCard key={service.id} {...service} />
      ))}
    </div>
  );
}

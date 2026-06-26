'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useCategories } from '@/hooks/use-categories';
import { useServices } from '@/hooks/use-services';
import { ServiceCard } from '@/components/shared/service-card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, PackageOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CategoryServicesPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: categories, isLoading: catLoading } = useCategories();
  const { data: services, isLoading: servicesLoading } = useServices(slug);

  const category = categories?.find((c) => c.slug === slug);

  if (catLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="mb-8 h-4 w-72" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 rounded-lg border p-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container py-16 text-center">
        <PackageOpen className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
        <h1 className="mb-2 text-2xl font-bold">Category not found</h1>
        <p className="mb-6 text-muted-foreground">
          The category you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button asChild>
          <Link href="/services">Browse all services</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/services">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to categories
        </Link>
      </Button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight" dir="auto">{category.name_ar}</h1>
        <p className="mt-1 text-muted-foreground">{category.name_en}</p>
        {category.description && (
          <p className="mt-1 text-sm text-muted-foreground/70">{category.description}</p>
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          {services?.length ?? 0} services available
        </p>
      </div>

      {/* Services */}
      {servicesLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 rounded-lg border p-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : services?.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <PackageOpen className="h-12 w-12 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">No services yet</p>
          <p className="text-sm text-muted-foreground/70">
            Services in this category are coming soon.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {services?.map((service) => (
            <ServiceCard key={service.id} {...service} />
          ))}
        </div>
      )}
    </div>
  );
}

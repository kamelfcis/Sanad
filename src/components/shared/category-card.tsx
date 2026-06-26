'use client';

import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCategoryIcon } from '@/lib/icons/category-icons';

interface CategoryCardProps {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  description: string | null;
  icon: string | null;
}

export function CategoryCard({ name_ar, name_en, slug, description, icon }: CategoryCardProps) {
  const Icon = getCategoryIcon(icon);

  return (
    <Link href={`/customer/services/${slug}`}>
      <Card className="h-full cursor-pointer transition-all hover:border-primary/50 hover:shadow-md">
        <CardHeader>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="mt-3 text-lg" dir="auto">
            {name_ar}
          </CardTitle>
          <CardDescription className="text-xs">{name_en}</CardDescription>
          {description && (
            <CardDescription className="line-clamp-2 text-xs">
              {description}
            </CardDescription>
          )}
        </CardHeader>
      </Card>
    </Link>
  );
}

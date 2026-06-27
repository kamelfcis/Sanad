'use client';

import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryIconDisplay } from '@/components/shared/category-icon-display';
import { resolveCategoryIconType, type CategoryIconType } from '@/lib/icons/category-icons';

interface CategoryCardProps {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  description: string | null;
  icon: string | null;
  icon_type?: CategoryIconType | string | null;
}

export function CategoryCard({
  name_ar,
  name_en,
  slug,
  description,
  icon,
  icon_type,
}: CategoryCardProps) {
  const resolvedType = resolveCategoryIconType(icon, icon_type);

  return (
    <Link href={`/customer/services/${slug}`}>
      <Card className="h-full cursor-pointer transition-all hover:border-primary/50 hover:shadow-md">
        <CardHeader>
          <CategoryIconDisplay
            icon={icon}
            iconType={resolvedType}
            alt={name_en}
            size="lg"
            variant="avatar"
          />
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

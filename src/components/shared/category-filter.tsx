'use client';

import { cn } from '@/lib/utils/cn';

interface CategoryOption {
  id: string;
  slug: string;
  name_ar: string;
}

export function CategoryFilter({
  categories,
  value,
  onChange,
}: {
  categories: CategoryOption[];
  value?: string;
  onChange: (slug: string | undefined) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange(undefined)}
        className={cn(
          'rounded-full border px-3 py-1 text-sm',
          !value ? 'border-primary bg-primary text-white' : 'border-border',
        )}
      >
        الكل
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onChange(category.slug)}
          className={cn(
            'rounded-full border px-3 py-1 text-sm',
            value === category.slug ? 'border-primary bg-primary text-white' : 'border-border',
          )}
        >
          {category.name_ar}
        </button>
      ))}
    </div>
  );
}

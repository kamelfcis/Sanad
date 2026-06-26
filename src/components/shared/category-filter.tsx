'use client';

import { cn } from '@/lib/utils/cn';

interface Category {
  slug: string;
  name_ar: string;
  name_en: string;
}

interface CategoryFilterProps {
  categories: Category[];
  selected: string | null;
  onSelect: (slug: string | null) => void;
}

export function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  const allSelected = selected === null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          'shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
          allSelected
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border hover:border-muted-foreground/50',
        )}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.slug}
          onClick={() => onSelect(cat.slug)}
          className={cn(
            'shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
            selected === cat.slug
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border hover:border-muted-foreground/50',
          )}
        >
          {cat.name_en}
        </button>
      ))}
    </div>
  );
}

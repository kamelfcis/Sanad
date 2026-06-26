'use client';

import Link from 'next/link';
import {
  EGYPT_GOVERNORATES,
  SPECIALTY_CHIP_ICONS,
  TECHNICIAN_SPECIALTIES,
} from '@/lib/constants/technician-registration';
import type { browseTechniciansSortSchema } from '@/lib/validations/technicians';
import { cn } from '@/lib/utils/cn';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { z } from 'zod';

type SortValue = z.infer<typeof browseTechniciansSortSchema>;

export interface ServicesBrowseFiltersState {
  specialty: string | null;
  governorate: string | null;
  sort: SortValue;
  maxPrice: number;
  availableOnly: boolean;
}

interface ServicesBrowseFiltersProps {
  filters: ServicesBrowseFiltersState;
  onChange: (patch: Partial<ServicesBrowseFiltersState>) => void;
}

const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: 'rating', label: 'أعلى تقييم' },
  { value: 'price', label: 'الأرخص' },
  { value: 'distance', label: 'الأقرب' },
  { value: 'response', label: 'أسرع استجابة' },
];

function SpecialtyChip({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex w-full items-center justify-center gap-2 rounded-full border px-3 py-2.5 text-sm font-semibold transition-all duration-200 md:px-4 md:py-3 md:text-[15px]',
        active
          ? 'border-secondary bg-secondary text-white shadow-md shadow-secondary/20'
          : 'border-border/70 bg-white text-text-primary shadow-sm hover:border-secondary/35 hover:shadow-md',
      )}
    >
      <span className="text-lg leading-none md:text-xl" aria-hidden>{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

export function ServicesBrowseFilters({ filters, onChange }: ServicesBrowseFiltersProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-end">
        <Link
          href="/auth/register-technician"
          className="text-sm font-semibold text-secondary transition-opacity hover:opacity-80"
        >
          انضم كصنايعي
        </Link>
      </div>

      {/* Specialty chips — two-row grid (reference layout) */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 md:gap-2.5">
        <SpecialtyChip
          active={filters.specialty == null}
          icon={SPECIALTY_CHIP_ICONS.all}
          label="الكل"
          onClick={() => onChange({ specialty: null })}
        />
        {TECHNICIAN_SPECIALTIES.map((item) => (
          <SpecialtyChip
            key={item.value}
            active={filters.specialty === item.value}
            icon={SPECIALTY_CHIP_ICONS[item.value] ?? '🔧'}
            label={item.label}
            onClick={() => onChange({ specialty: item.value })}
          />
        ))}
      </div>

      {/* Filter bar — single row like reference */}
      <div
        className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-white px-4 py-4 shadow-sm md:flex-row md:flex-wrap md:items-end md:gap-5 md:px-5 md:py-5"
      >
        <div className="min-w-[140px] flex-1 space-y-2">
          <Label htmlFor="governorate-filter" className="text-sm font-semibold text-text-primary">
            المحافظة
          </Label>
          <Select
            value={filters.governorate ?? 'all'}
            onValueChange={(value) =>
              onChange({ governorate: value === 'all' ? null : value })
            }
          >
            <SelectTrigger
              id="governorate-filter"
              className="h-10 rounded-xl border-border/80 bg-white shadow-none"
            >
              <SelectValue placeholder="كل المحافظات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المحافظات</SelectItem>
              {EGYPT_GOVERNORATES.map((gov) => (
                <SelectItem key={gov} value={gov}>
                  {gov}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[140px] flex-1 space-y-2">
          <Label htmlFor="sort-filter" className="text-sm font-semibold text-text-primary">
            ترتيب حسب
          </Label>
          <Select
            value={filters.sort}
            onValueChange={(value) => onChange({ sort: value as SortValue })}
          >
            <SelectTrigger
              id="sort-filter"
              className="h-10 rounded-xl border-border/80 bg-white shadow-none"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[200px] flex-[1.4] space-y-2">
          <Label
            htmlFor="max-price-filter"
            className="text-sm font-semibold text-text-primary"
          >
            أقصى سعر: {filters.maxPrice} ج.م
          </Label>
          <input
            id="max-price-filter"
            type="range"
            min={100}
            max={1000}
            step={25}
            value={filters.maxPrice}
            onChange={(event) => onChange({ maxPrice: Number(event.target.value) })}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-secondary [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-secondary"
          />
        </div>

        <div className="flex items-center gap-2.5 pb-0.5 md:min-w-[160px] md:justify-end">
          <Checkbox
            id="available-only"
            checked={filters.availableOnly}
            onCheckedChange={(checked) => onChange({ availableOnly: checked === true })}
            className="border-secondary/40 data-[state=checked]:bg-secondary data-[state=checked]:text-white"
          />
          <Label
            htmlFor="available-only"
            className="cursor-pointer text-sm font-semibold text-text-primary"
          >
            متاح دلوقتي بس
          </Label>
        </div>
      </div>
    </section>
  );
}

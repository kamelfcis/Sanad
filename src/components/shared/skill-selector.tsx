'use client';

import { useCategories } from '@/hooks/use-categories';
import { useServices } from '@/hooks/use-services';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils/cn';
import { useState } from 'react';

interface SelectedSkill {
  service_id: string;
  price_override: number | null;
}

interface SkillSelectorProps {
  selected: SelectedSkill[];
  onChange: (skills: SelectedSkill[]) => void;
}

export function SkillSelector({ selected, onChange }: SkillSelectorProps) {
  const { data: categories } = useCategories();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggleSkill = (serviceId: string, defaultPrice: number | null) => {
    // defaultPrice can be used to set price_override when toggling
    void defaultPrice;
    const exists = selected.find((s) => s.service_id === serviceId);
    if (exists) {
      onChange(selected.filter((s) => s.service_id !== serviceId));
    } else {
      onChange([...selected, { service_id: serviceId, price_override: null }]);
    }
  };

  const updatePriceOverride = (serviceId: string, price: number | null) => {
    onChange(
      selected.map((s) =>
        s.service_id === serviceId ? { ...s, price_override: price } : s,
      ),
    );
  };

  const isSelected = (serviceId: string) => selected.some((s) => s.service_id === serviceId);
  const getOverride = (serviceId: string) => selected.find((s) => s.service_id === serviceId)?.price_override;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Select the services you offer. You can optionally set your own price for each service.
      </p>

      <div className="space-y-2">
        {categories?.map((cat) => (
          <CategoryServiceGroup
            key={cat.id}
            category={cat}
            isExpanded={expandedCategory === cat.slug}
            onToggle={() =>
              setExpandedCategory(expandedCategory === cat.slug ? null : cat.slug)
            }
            selectedSkills={selected}
            onToggleSkill={toggleSkill}
            onPriceChange={updatePriceOverride}
            isSelected={isSelected}
            getOverride={getOverride}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryServiceGroup({
  category,
  isExpanded,
  onToggle,
  selectedSkills,
  onToggleSkill,
  onPriceChange,
  isSelected,
  getOverride,
}: {
  category: { slug: string; name_ar: string; name_en: string };
  isExpanded: boolean;
  onToggle: () => void;
  selectedSkills: SelectedSkill[];
  onToggleSkill: (id: string, price: number | null) => void;
  onPriceChange: (id: string, price: number | null) => void;
  isSelected: (id: string) => boolean;
  getOverride: (id: string) => number | null | undefined;
}) {
  const { data: services } = useServices(category.slug);
  const categoryCount = selectedSkills.filter((s) =>
    services?.some((svc) => svc.id === s.service_id),
  ).length;

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/50"
      >
        <div>
          <span className="font-medium" dir="auto">{category.name_ar}</span>
          <span className="ml-2 text-sm text-muted-foreground">{category.name_en}</span>
        </div>
        <div className="flex items-center gap-2">
          {categoryCount > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {categoryCount}
            </span>
          )}
          <span className="text-sm text-muted-foreground">{isExpanded ? '−' : '+'}</span>
        </div>
      </button>

      {isExpanded && (
        <div className="space-y-1 border-t px-4 py-2">
          {services?.length === 0 && (
            <p className="py-2 text-sm text-muted-foreground">No services in this category.</p>
          )}
          {services?.map((svc) => (
            <div
              key={svc.id}
              className={cn(
                'flex items-center gap-3 rounded-md px-2 py-2 transition-colors',
                isSelected(svc.id) && 'bg-primary/5',
              )}
            >
              <Checkbox
                id={`skill-${svc.id}`}
                checked={isSelected(svc.id)}
                onCheckedChange={() => onToggleSkill(svc.id, svc.price)}
              />
              <Label
                htmlFor={`skill-${svc.id}`}
                className="flex flex-1 cursor-pointer items-center justify-between"
              >
                <div>
                  <span dir="auto">{svc.name_ar}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{svc.name_en}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {svc.price ? `${svc.price.toFixed(0)} SAR` : '—'}
                </span>
              </Label>

              {isSelected(svc.id) && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Your price:</span>
                  <Input
                    type="number"
                    placeholder="Price"
                    className="h-8 w-20 text-xs"
                    value={getOverride(svc.id) ?? ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      onPriceChange(svc.id, val);
                    }}
                  />
                  <span className="text-xs text-muted-foreground">SAR</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

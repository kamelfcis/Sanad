import {
  Bath,
  Building2,
  Car,
  Cloud,
  Droplet,
  Droplets,
  Fan,
  Flame,
  Grid3x3,
  Hammer,
  Home,
  Key,
  LayoutGrid,
  Paintbrush,
  Pickaxe,
  Plug,
  Scissors,
  Shield,
  Snowflake,
  Sparkles,
  Square,
  Sun,
  Thermometer,
  Truck,
  Wrench,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type CategoryIconType = 'preset' | 'upload';

export const categoryIconMap: Record<string, LucideIcon> = {
  droplet: Droplet,
  droplets: Droplets,
  zap: Zap,
  snowflake: Snowflake,
  hammer: Hammer,
  paintbrush: Paintbrush,
  sparkles: Sparkles,
  wrench: Wrench,
  square: Square,
  grid: Grid3x3,
  'layout-grid': LayoutGrid,
  tool: Pickaxe,
  home: Home,
  flame: Flame,
  shield: Shield,
  plug: Plug,
  fan: Fan,
  truck: Truck,
  scissors: Scissors,
  bath: Bath,
  building: Building2,
  car: Car,
  key: Key,
  cloud: Cloud,
  sun: Sun,
  thermometer: Thermometer,
};

export const CATEGORY_PRESET_ICON_KEYS = Object.keys(categoryIconMap);

export function getCategoryIcon(iconKey: string | null | undefined): LucideIcon {
  if (iconKey && categoryIconMap[iconKey]) {
    return categoryIconMap[iconKey];
  }
  return Pickaxe;
}

export function isUploadedCategoryIcon(
  icon: string | null | undefined,
  iconType?: CategoryIconType | string | null,
): boolean {
  if (iconType === 'upload') return true;
  if (iconType === 'preset') return false;
  return !!icon && (icon.startsWith('http://') || icon.startsWith('https://'));
}

export function resolveCategoryIconType(
  icon: string | null | undefined,
  iconType?: CategoryIconType | string | null,
): CategoryIconType {
  return isUploadedCategoryIcon(icon, iconType) ? 'upload' : 'preset';
}

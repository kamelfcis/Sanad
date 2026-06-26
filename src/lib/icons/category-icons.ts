import {
  Droplet,
  Zap,
  Snowflake,
  Hammer,
  Paintbrush,
  Sparkles,
  Wrench,
  Square,
  Grid3x3,
  LayoutGrid,
  Pickaxe,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const categoryIconMap: Record<string, LucideIcon> = {
  droplet: Droplet,
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
};

export function getCategoryIcon(iconKey: string | null | undefined): LucideIcon {
  if (iconKey && categoryIconMap[iconKey]) {
    return categoryIconMap[iconKey];
  }
  return Pickaxe;
}

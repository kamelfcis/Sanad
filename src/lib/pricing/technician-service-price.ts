import type { RawSkill } from '@/lib/technicians/browse';

/** Single price source: skill override, else catalog service price. */
export function resolveSkillPrice(skill: RawSkill): number | null {
  const base = skill.services?.price;
  if (skill.price_override != null) return Number(skill.price_override);
  if (base != null) return Number(base);
  return null;
}

export function resolveTechnicianServicePrice(
  activeSkills: RawSkill[],
  serviceId: string | null | undefined,
  categorySlug?: string,
): number {
  if (serviceId) {
    const match = activeSkills.find((s) => s.services?.id === serviceId);
    if (match) {
      const price = resolveSkillPrice(match);
      if (price != null) return price;
    }
  }

  if (categorySlug) {
    const match = activeSkills.find((s) => s.services?.service_categories?.slug === categorySlug);
    if (match) {
      const price = resolveSkillPrice(match);
      if (price != null) return price;
    }
  }

  const prices = activeSkills
    .map((skill) => resolveSkillPrice(skill))
    .filter((price): price is number => price != null);

  if (prices.length === 0) return 0;
  return Math.min(...prices);
}

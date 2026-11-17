/** Specialty options mapped to service_categories.slug */
export const TECHNICIAN_SPECIALTIES = [
  { value: 'general-contractor', label: 'مقاول متكامل', categorySlug: 'general-contractor' },
  { value: 'concrete', label: 'خرسانة', categorySlug: 'concrete' },
  { value: 'plaster', label: 'محارة', categorySlug: 'plaster' },
  { value: 'marble', label: 'رخام', categorySlug: 'marble' },
  { value: 'plumbing', label: 'سباك', categorySlug: 'plumbing' },
  { value: 'ac-repair', label: 'فني تكييف', categorySlug: 'ac-repair' },
  { value: 'painting', label: 'نقاش / دهانات', categorySlug: 'painting' },
  { value: 'tiling', label: 'مبلط سيراميك', categorySlug: 'tiling' },
  { value: 'electrical', label: 'كهربائي', categorySlug: 'electrical' },
  { value: 'carpentry', label: 'نجار', categorySlug: 'carpentry' },
  { value: 'drywall', label: 'جبس بورد', categorySlug: 'drywall' },
  { value: 'general-maintenance', label: 'مقاول تشطيبات', categorySlug: 'general-maintenance' },
  { value: 'metalwork', label: 'ألوميتال', categorySlug: 'metalwork' },
  { value: 'satellite', label: 'فني دش', categorySlug: 'general-maintenance' },
  { value: 'appliance-repair', label: 'تصليح أجهزة', categorySlug: 'general-maintenance' },
] as const;

export const CONTRACTOR_KINDS = [
  { value: 'specialist', label: 'مقاول متخصص' },
  { value: 'integrated', label: 'مقاول متكامل' },
] as const;

export const PROVIDER_ROLES = [
  { value: 'technician', label: 'فني' },
  { value: 'contractor', label: 'مقاول' },
] as const;

/** none = unavailable for new work, low = limited, high = large. */
export const CAPACITY_TIERS = [
  { value: 'none', label: 'غير متاح لشغل جديد', description: 'لا يستقبل طلبات جديدة' },
  { value: 'low', label: 'قدرة محدودة', description: 'شغل محدود' },
  { value: 'high', label: 'قدرة كبيرة', description: 'يستقبل مشاريع كبيرة' },
] as const;

export const TEAM_SIZES = [5, 10, 20] as const;

export type ContractorKind = (typeof CONTRACTOR_KINDS)[number]['value'];
export type CapacityTier = (typeof CAPACITY_TIERS)[number]['value'];
export type ProviderRole = (typeof PROVIDER_ROLES)[number]['value'];
export type TeamSize = (typeof TEAM_SIZES)[number];

const TECHNICIAN_TRADE_ORDER = [
  'plumbing',
  'carpentry',
  'electrical',
  'ac-repair',
  'plaster',
  'painting',
  'tiling',
  'marble',
] as const;

const SPECIALIST_FIRST = ['concrete', 'plaster', 'painting'] as const;

export const TECHNICIAN_TRADE_SPECIALTIES = TECHNICIAN_TRADE_ORDER.map((value) => {
  const match = TECHNICIAN_SPECIALTIES.find((item) => item.value === value);
  if (!match) throw new Error(`Missing technician trade ${value}`);
  return match;
});

export const SPECIALIST_CONTRACTOR_SPECIALTIES = [
  ...SPECIALIST_FIRST.map((value) => {
    const match = TECHNICIAN_SPECIALTIES.find((item) => item.value === value);
    if (!match) throw new Error(`Missing specialist trade ${value}`);
    return match;
  }),
  ...TECHNICIAN_SPECIALTIES.filter(
    (item) =>
      item.value !== 'general-contractor' &&
      !SPECIALIST_FIRST.includes(item.value as (typeof SPECIALIST_FIRST)[number]),
  ),
];

export const SPECIALTY_CHIP_ICONS: Record<string, string> = {
  all: '✨',
  'general-contractor': '🏗️',
  concrete: '🧱',
  plaster: '🪣',
  marble: '💎',
  electrical: '⚡',
  plumbing: '🔧',
  carpentry: '🪚',
  painting: '🎨',
  tiling: '🧱',
  drywall: '🏛️',
  'ac-repair': '❄️',
  'general-maintenance': '🏗️',
  metalwork: '🪟',
  satellite: '📡',
  'appliance-repair': '🔌',
};

export function contractorKindLabel(kind: ContractorKind): string {
  return CONTRACTOR_KINDS.find((item) => item.value === kind)?.label ?? kind;
}

export function capacityTierLabel(tier: CapacityTier): string {
  return CAPACITY_TIERS.find((item) => item.value === tier)?.label ?? tier;
}

export function providerRoleLabel(role: ProviderRole): string {
  return PROVIDER_ROLES.find((item) => item.value === role)?.label ?? role;
}

export function teamSizeLabel(size: TeamSize | number): string {
  return `${size} أفراد`;
}

export function resolveContractorKindFromSpecialty(
  specialty: TechnicianSpecialtyValue,
  explicit?: ContractorKind,
): ContractorKind {
  if (explicit) return explicit;
  return specialty === 'general-contractor' ? 'integrated' : 'specialist';
}

export type TechnicianSpecialtyValue = (typeof TECHNICIAN_SPECIALTIES)[number]['value'];

export const EGYPT_GOVERNORATES = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'القليوبية',
  'الشرقية',
  'الدقهلية',
  'المنوفية',
  'الغربية',
  'البحيرة',
  'أسوان',
  'الأقصر',
  'أسيوط',
] as const;

export type EgyptGovernorate = (typeof EGYPT_GOVERNORATES)[number];

export const SUBSCRIPTION_BENEFITS = [
  'ظهور في نتائج البحث',
  'استقبال طلبات العملاء',
  'شات مباشر مع العملاء',
  'شارات الثقة والتقييم',
  'تحديث الأسعار وقت ما تحب',
] as const;

export const TRUST_BULLETS = [
  { icon: '📈', text: 'آلاف العملاء يبحثون يوميًا' },
  { icon: '💳', text: 'طرق دفع آمنة بالفيزا' },
  { icon: '🛡️', text: 'حماية من الحسابات الوهمية' },
  { icon: '⭐', text: 'تقييمات حقيقية تبني سمعتك' },
] as const;

export const CONTRACTOR_TRUST_BULLETS = [
  { icon: '📋', text: 'ترسل عرض سعر للمشروع كاملًا' },
  { icon: '👥', text: 'تحدد سعة الفريق وحجم الشغل' },
  { icon: '🏗️', text: 'مشاريع أكبر من الزيارة الواحدة' },
  { icon: '⭐', text: 'تقييمات حقيقية تبني سمعتك' },
] as const;

export function specialtyToCategorySlug(specialty: TechnicianSpecialtyValue): string {
  const match = TECHNICIAN_SPECIALTIES.find((s) => s.value === specialty);
  return match?.categorySlug ?? 'general-maintenance';
}

/** Arabic trade label; never use phone, email, or an id as a stand-in. */
export function specialtyArabicLabel(value: string | null | undefined): string | null {
  const slug = value?.trim();
  if (!slug) return null;
  return (
    TECHNICIAN_SPECIALTIES.find(
      (item) => item.value === slug || item.categorySlug === slug,
    )?.label ?? null
  );
}

export function normalizeEgyptianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('20') && digits.length === 12) {
    return `0${digits.slice(2)}`;
  }
  if (digits.startsWith('0')) {
    return digits;
  }
  return digits;
}

export function phoneToTechnicianEmail(phone: string): string {
  const normalized = normalizeEgyptianPhone(phone);
  return `tech+${normalized}@sanad.app`;
}

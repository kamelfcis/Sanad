/** Specialty options mapped to service_categories.slug */
export const TECHNICIAN_SPECIALTIES = [
  { value: 'electrical', label: 'كهربائي', categorySlug: 'electrical' },
  { value: 'plumbing', label: 'سباك', categorySlug: 'plumbing' },
  { value: 'carpentry', label: 'نجار', categorySlug: 'carpentry' },
  { value: 'painting', label: 'نقاش / دهانات', categorySlug: 'painting' },
  { value: 'tiling', label: 'مبلط سيراميك', categorySlug: 'tiling' },
  { value: 'drywall', label: 'جبس بورد', categorySlug: 'drywall' },
  { value: 'ac-repair', label: 'فني تكييف', categorySlug: 'ac-repair' },
  { value: 'general-maintenance', label: 'مقاول تشطيبات', categorySlug: 'general-maintenance' },
  { value: 'metalwork', label: 'ألوميتال', categorySlug: 'metalwork' },
  { value: 'satellite', label: 'فني دش', categorySlug: 'general-maintenance' },
  { value: 'appliance-repair', label: 'تصليح أجهزة', categorySlug: 'general-maintenance' },
] as const;

export const SPECIALTY_CHIP_ICONS: Record<string, string> = {
  all: '✨',
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

export function specialtyToCategorySlug(specialty: TechnicianSpecialtyValue): string {
  const match = TECHNICIAN_SPECIALTIES.find((s) => s.value === specialty);
  return match?.categorySlug ?? 'general-maintenance';
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

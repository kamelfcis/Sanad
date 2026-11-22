import { TERMS_SECTIONS } from '@/lib/constants/terms';

export const LIABILITY_POLICY_TITLE = 'الشروط والأحكام';

export const LIABILITY_POLICY_PARAGRAPHS: string[] = TERMS_SECTIONS.flatMap((section) => [
  section.title,
  ...(section.intro ? [section.intro] : []),
  ...(section.bullets ?? []).map((bullet) => `• ${bullet}`),
  ...(section.paragraphs ?? []),
]);

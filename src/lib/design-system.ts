/**
 * Sanad design system — single source of truth for visual tokens.
 * CSS variables in globals.css remain the runtime source; this file
 * provides typed constants for JS/TS usage (animations, inline styles, metadata).
 */

export const colors = {
  primary: '#FF6B00',
  primaryLight: '#FF8A34',
  secondary: '#194E5B',
  secondaryLight: '#2D6C7C',
  background: '#FAFAFA',
  foreground: '#0F172A',
  surface: '#F5F5F5',
  muted: '#F4F4F5',
  mutedForeground: '#64748B',
  border: '#E8E8E8',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  success: '#10B981',
  warning: '#F59E0B',
  destructive: '#EF4444',
  accent: '#FF8A34',
} as const;

export const darkColors = {
  background: '#0B1720',
  foreground: '#F8FAFC',
  surface: '#122430',
  card: '#162B38',
  border: '#1E3A4A',
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#64748B',
} as const;

export const gradients = {
  primary: 'linear-gradient(135deg, #FF6B00, #FF8A34)',
  secondary: 'linear-gradient(135deg, #194E5B, #2D6C7C)',
  hero: 'linear-gradient(to bottom, var(--background), var(--surface))',
  overlay: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)',
} as const;

export const typography = {
  fontSans: 'var(--font-tajawal), var(--font-cairo), ui-sans-serif, system-ui, sans-serif',
  fontHeading: 'var(--font-tajawal), var(--font-cairo), ui-sans-serif, system-ui, sans-serif',
  fontArabic: 'var(--font-tajawal), var(--font-cairo), ui-sans-serif, system-ui, sans-serif',
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
  },
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

export const radius = {
  sm: 'calc(0.625rem - 4px)',
  md: 'calc(0.625rem - 2px)',
  lg: '0.625rem',
  xl: 'calc(0.625rem + 4px)',
  '2xl': '1rem',
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  primary: '0 4px 14px 0 rgb(255 107 0 / 0.2)',
} as const;

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
  section: '6rem',
} as const;

export const animation = {
  duration: {
    fast: 0.2,
    normal: 0.4,
    slow: 0.6,
  },
  easing: {
    default: [0.25, 0.1, 0.25, 1] as const,
    out: [0, 0, 0.2, 1] as const,
    spring: [0.34, 1.56, 0.64, 1] as const,
  },
} as const;

export const designSystem = {
  colors,
  darkColors,
  gradients,
  typography,
  radius,
  shadows,
  spacing,
  animation,
} as const;

export default designSystem;

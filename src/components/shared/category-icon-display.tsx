'use client';

import { cn } from '@/lib/utils/cn';
import {
  getCategoryIcon,
  isUploadedCategoryIcon,
  type CategoryIconType,
} from '@/lib/icons/category-icons';

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
} as const;

const avatarSizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-11 w-11',
  xl: 'h-14 w-14',
} as const;

interface CategoryIconDisplayProps {
  icon: string | null | undefined;
  iconType?: CategoryIconType | string | null;
  alt?: string;
  size?: keyof typeof sizeClasses;
  className?: string;
  /** Render inside a rounded avatar container */
  variant?: 'plain' | 'avatar';
}

export function CategoryIconDisplay({
  icon,
  iconType,
  alt = '',
  size = 'md',
  className,
  variant = 'plain',
}: CategoryIconDisplayProps) {
  const uploaded = isUploadedCategoryIcon(icon, iconType);

  if (uploaded && icon) {
    const img = (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={icon}
        alt={alt}
        className={cn(
          variant === 'avatar' ? avatarSizeClasses[size] : sizeClasses[size],
          variant === 'avatar' ? 'rounded-full object-cover ring-2 ring-[#FF6B00]/10' : 'object-contain',
          className,
        )}
      />
    );

    if (variant === 'avatar') return img;

    return (
      <span className={cn('inline-flex shrink-0 items-center justify-center', className)}>
        {img}
      </span>
    );
  }

  const Icon = getCategoryIcon(icon);

  if (variant === 'avatar') {
    return (
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B00]/15 to-[#FF8A34]/10 ring-2 ring-[#FF6B00]/10',
          avatarSizeClasses[size],
          className,
        )}
        data-category-icon={icon ?? 'default'}
      >
        <Icon className={cn(sizeClasses[size], 'text-[#FF6B00]')} aria-hidden />
      </span>
    );
  }

  return (
    <Icon
      className={cn(sizeClasses[size], 'text-[#FF6B00]', className)}
      aria-hidden
      data-category-icon={icon ?? 'default'}
    />
  );
}

'use client';

import Image, { type ImageProps } from 'next/image';
import { BLUR_DATA_URL } from '@/lib/utils/image';
import { cn } from '@/lib/utils/cn';

interface OptimizedImageProps extends Omit<ImageProps, 'placeholder'> {
  blur?: boolean;
}

export function OptimizedImage({
  blur = true,
  className,
  alt,
  sizes,
  ...props
}: OptimizedImageProps) {
  return (
    <Image
      alt={alt}
      className={cn('object-cover', className)}
      placeholder={blur ? 'blur' : 'empty'}
      blurDataURL={blur ? BLUR_DATA_URL : undefined}
      sizes={sizes ?? '(max-width: 768px) 100vw, 50vw'}
      {...props}
    />
  );
}

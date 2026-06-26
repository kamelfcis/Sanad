'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  isActive?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
  className?: string;
}

export function NavLink({ href, children, isActive, onMouseEnter, onMouseLeave, onClick, className }: NavLinkProps) {
  return (
    <Link
      href={href}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      className={cn(
        'group relative whitespace-nowrap px-1 py-2 text-[14px] font-semibold tracking-wide transition-colors duration-200 xl:text-[15px]',
        'after:absolute after:inset-x-0 after:-bottom-[3px] after:h-[3px] after:origin-center after:rounded-full after:bg-primary after:scale-x-0 after:transition-transform after:duration-300',
        'hover:after:scale-x-100',
        isActive
          ? 'text-primary after:scale-x-100'
          : 'text-text-secondary hover:text-primary',
        className,
      )}
      style={{ fontFamily: 'var(--font-heading)' }}
    >
      {children}
    </Link>
  );
}

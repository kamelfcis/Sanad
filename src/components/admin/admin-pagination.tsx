'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { cn } from '@/lib/utils/cn';

const SIBLING_COUNT = 1;

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function getPaginationRange(
  currentPage: number,
  totalPages: number,
): (number | 'ellipsis')[] {
  if (totalPages <= 1) return totalPages === 0 ? [] : [1];

  const totalPageNumbers = SIBLING_COUNT * 2 + 5;

  if (totalPages <= totalPageNumbers) {
    return range(1, totalPages);
  }

  const leftSibling = Math.max(currentPage - SIBLING_COUNT, 1);
  const rightSibling = Math.min(currentPage + SIBLING_COUNT, totalPages);

  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < totalPages - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftRange = range(1, 3 + SIBLING_COUNT * 2);
    return [...leftRange, 'ellipsis', totalPages];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightRange = range(totalPages - (3 + SIBLING_COUNT * 2) + 1, totalPages);
    return [1, 'ellipsis', ...rightRange];
  }

  return [1, 'ellipsis', ...range(leftSibling, rightSibling), 'ellipsis', totalPages];
}

export interface AdminPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
  summaryClassName?: string;
}

export function AdminPagination({
  page,
  totalPages,
  total,
  onPageChange,
  className,
  summaryClassName,
}: AdminPaginationProps) {
  const { t, dir } = useAdminT();
  const isRtl = dir === 'rtl';
  const safeTotalPages = Math.max(1, totalPages);
  const pages = getPaginationRange(page, safeTotalPages);
  const isFirstPage = page <= 1;
  const isLastPage = page >= safeTotalPages;

  const PreviousIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div
      className={cn(
        'mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <p className={cn('text-sm text-[#64748B]', summaryClassName)}>
        {t('common.pageOf', {
          page,
          totalPages: safeTotalPages,
          total,
        })}
      </p>

      <nav dir={dir} aria-label={t('common.pagination')} className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={isFirstPage}
          onClick={() => onPageChange(page - 1)}
          className="border-[#E2E8F0]"
          aria-label={t('common.previous')}
        >
          {!isRtl && <PreviousIcon className="h-4 w-4" />}
          {t('common.previous')}
          {isRtl && <PreviousIcon className="h-4 w-4" />}
        </Button>

        <div dir="ltr" className="flex items-center gap-1">
          {pages.map((item, index) =>
            item === 'ellipsis' ? (
              <span
                key={`ellipsis-${index}`}
                className="flex h-8 min-w-8 items-center justify-center px-1 text-sm text-[#64748B]"
                aria-hidden
              >
                …
              </span>
            ) : (
              <Button
                key={item}
                variant="outline"
                size="sm"
                disabled={item === page}
                onClick={() => onPageChange(item)}
                aria-label={t('common.goToPage', { page: item })}
                aria-current={item === page ? 'page' : undefined}
                className={cn(
                  'h-8 min-w-8 border-[#E2E8F0] px-2 tabular-nums',
                  item === page &&
                    'border-[#FF6B00] bg-[#FF6B00] text-white hover:bg-[#FF6B00] hover:text-white disabled:opacity-100',
                )}
              >
                {item}
              </Button>
            ),
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={isLastPage}
          onClick={() => onPageChange(page + 1)}
          className="border-[#E2E8F0]"
          aria-label={t('common.next')}
        >
          {isRtl && <NextIcon className="h-4 w-4" />}
          {t('common.next')}
          {!isRtl && <NextIcon className="h-4 w-4" />}
        </Button>
      </nav>
    </div>
  );
}

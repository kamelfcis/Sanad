'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ADMIN_PAGE_SIZE_OPTIONS,
  type AdminPageSize,
} from '@/lib/admin/pagination';
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
  limit?: number;
  pageSizeOptions?: readonly AdminPageSize[];
  onLimitChange?: (limit: AdminPageSize) => void;
  className?: string;
  summaryClassName?: string;
}

export function AdminPagination({
  page,
  totalPages,
  total,
  onPageChange,
  limit,
  pageSizeOptions = ADMIN_PAGE_SIZE_OPTIONS,
  onLimitChange,
  className,
  summaryClassName,
}: AdminPaginationProps) {
  const { t, dir } = useAdminT();
  const isRtl = dir === 'rtl';
  const safeTotalPages = Math.max(1, totalPages);
  const pages = getPaginationRange(page, safeTotalPages);
  const isFirstPage = page <= 1;
  const isLastPage = page >= safeTotalPages;

  const FirstIcon = isRtl ? ChevronsRight : ChevronsLeft;
  const LastIcon = isRtl ? ChevronsLeft : ChevronsRight;
  const PreviousIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div
      className={cn(
        'mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className={cn('flex flex-wrap items-center gap-3', summaryClassName)}>
        <p className="text-sm text-[#64748B]">
          {t('common.pageOf', {
            page,
            totalPages: safeTotalPages,
            total,
          })}
        </p>

        {onLimitChange && limit != null ? (
          <label className="flex items-center gap-2 text-sm text-[#64748B]">
            <span>{t('common.rowsPerPage')}</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value) as AdminPageSize)}
              aria-label={t('common.rowsPerPage')}
              className="h-8 rounded-lg border border-[#E2E8F0] bg-white px-2 text-sm text-[#0F172A] shadow-sm focus:border-[#FF6B00] focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <nav dir={dir} aria-label={t('common.pagination')} className="flex flex-wrap items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={isFirstPage}
          onClick={() => onPageChange(1)}
          className="border-[#E2E8F0]"
          aria-label={t('common.first')}
        >
          {!isRtl && <FirstIcon className="h-4 w-4" />}
          <span className="hidden sm:inline">{t('common.first')}</span>
          {isRtl && <FirstIcon className="h-4 w-4" />}
        </Button>

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

        <Button
          variant="outline"
          size="sm"
          disabled={isLastPage}
          onClick={() => onPageChange(safeTotalPages)}
          className="border-[#E2E8F0]"
          aria-label={t('common.last')}
        >
          {isRtl && <LastIcon className="h-4 w-4" />}
          <span className="hidden sm:inline">{t('common.last')}</span>
          {!isRtl && <LastIcon className="h-4 w-4" />}
        </Button>
      </nav>
    </div>
  );
}

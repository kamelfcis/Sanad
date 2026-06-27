'use client';

import { Skeleton } from '@/components/ui/skeleton';
import {
  AdminListViewToggle,
  AdminPageHeader,
} from '@/components/admin/admin-list-chrome';
import { AdminPremiumTableFooter } from '@/components/admin/admin-premium-table';
import {
  type AdminListViewMode,
  useAdminListView,
} from '@/hooks/use-admin-list-view';
import { cn } from '@/lib/utils/cn';

export interface AdminListShellProps {
  pageId: string;
  title: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  defaultView?: AdminListViewMode;
  beforeContent?: React.ReactNode;
  filters?: React.ReactNode;
  search?: React.ReactNode;
  toolbar?: React.ReactNode;
  isLoading: boolean;
  error?: string | null;
  isEmpty: boolean;
  empty: React.ReactNode;
  table: React.ReactNode;
  cards: React.ReactNode;
  pagination?: React.ReactNode;
  skeletonCount?: number;
  skeletonClassName?: string;
  cardsLayout?: 'grid' | 'stack';
  hideToggle?: boolean;
}

function AdminListSkeleton({
  count,
  className,
}: {
  count: number;
  className: string;
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={className} />
      ))}
    </div>
  );
}

export function AdminListShell({
  pageId,
  title,
  subtitle,
  headerActions,
  defaultView = 'table',
  beforeContent,
  filters,
  search,
  toolbar,
  isLoading,
  error,
  isEmpty,
  empty,
  table,
  cards,
  pagination,
  skeletonCount = 5,
  skeletonClassName = 'h-16 w-full rounded-2xl',
  cardsLayout = 'grid',
  hideToggle = false,
}: AdminListShellProps) {
  const [viewMode, setViewMode] = useAdminListView(pageId, defaultView);

  const showToolbar = search || toolbar || !hideToggle;

  return (
    <div className="p-6">
      <AdminPageHeader title={title} subtitle={subtitle} actions={headerActions} />

      {beforeContent}

      {filters}

      {showToolbar ? (
        <div className="mb-6 flex flex-wrap items-center gap-4">
          {search}
          {toolbar}
          {!hideToggle ? (
            <div className={cn(search || toolbar ? 'ms-auto' : 'ms-auto w-full sm:w-auto')}>
              <AdminListViewToggle value={viewMode} onChange={setViewMode} />
            </div>
          ) : null}
        </div>
      ) : null}

      {isLoading ? (
        <AdminListSkeleton count={skeletonCount} className={skeletonClassName} />
      ) : error ? (
        <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : isEmpty ? (
        empty
      ) : (
        <>
          {viewMode === 'table' ? table : (
            <div
              className={
                cardsLayout === 'stack'
                  ? 'space-y-3'
                  : 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3'
              }
            >
              {cards}
            </div>
          )}
          {pagination ? <AdminPremiumTableFooter>{pagination}</AdminPremiumTableFooter> : null}
        </>
      )}
    </div>
  );
}

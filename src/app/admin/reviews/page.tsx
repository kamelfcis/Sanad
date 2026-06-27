'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react';
import { useAdminReviews, useAdminModerateReview } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AdminPremiumTable,
  AdminPremiumTableBody,
  AdminPremiumTableCell,
  AdminPremiumTableHead,
  AdminPremiumTableHeaderCell,
  AdminPremiumTableRow,
} from '@/components/admin/admin-premium-table';
import {
  AdminEmptyState,
  AdminEntityCard,
  AdminEntityCardActions,
  AdminEntityCardActionsGroup,
  AdminEntityCardHeader,
  AdminEntityCardInfoBox,
  AdminEntityCardMeta,
  AdminEntityCardMetaPill,
  AdminEntityCardPrimaryAction,
  AdminFilterPills,
} from '@/components/admin/admin-list-chrome';
import { AdminListShell } from '@/components/admin/admin-list-shell';
import { AdminPagination } from '@/components/admin/admin-pagination';
import { Star, Eye, EyeOff, Calendar } from 'lucide-react';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { translateAdminError } from '@/lib/i18n/admin/translate-error';
import { cn } from '@/lib/utils/cn';

function ReviewRating({ rating }: { rating: number }) {
  return <span className="text-yellow-500">{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>;
}

function ReviewModerationPanel({
  review,
  note,
  onNoteChange,
  onModerate,
  onCancel,
  isPending,
  t,
}: {
  review: any;
  note: string;
  onNoteChange: (value: string) => void;
  onModerate: () => void;
  onCancel: () => void;
  isPending: boolean;
  t: ReturnType<typeof useAdminT>['t'];
}) {
  return (
    <div className="space-y-2">
      <div>
        <Label htmlFor={`note-${review.id}`} className="text-xs">
          {t('reviews.noteOptional')}
        </Label>
        <Input
          id={`note-${review.id}`}
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder={t('reviews.notePlaceholder')}
          className="h-8 w-full text-xs sm:w-40"
        />
      </div>
      <div className="flex gap-1">
        <Button size="sm" variant="outline" onClick={onModerate} disabled={isPending}>
          {review.is_hidden ? t('reviews.restore') : t('reviews.hide')}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  );
}

function ReviewModerateButton({
  review,
  onClick,
  t,
  iconMargin,
}: {
  review: any;
  onClick: () => void;
  t: ReturnType<typeof useAdminT>['t'];
  iconMargin: string;
}) {
  return (
    <Button size="sm" variant="outline" onClick={onClick}>
      {review.is_hidden ? (
        <Eye className={cn('h-4 w-4', iconMargin)} />
      ) : (
        <EyeOff className={cn('h-4 w-4', iconMargin)} />
      )}
      {t('reviews.moderate')}
    </Button>
  );
}

function ReviewCard({
  review,
  activeModeration,
  note,
  onNoteChange,
  onStartModeration,
  onCancelModeration,
  onModerate,
  isPending,
  t,
  formatDateTime,
}: {
  review: any;
  activeModeration: string | null;
  note: string;
  onNoteChange: (value: string) => void;
  onStartModeration: (id: string) => void;
  onCancelModeration: () => void;
  onModerate: (reviewId: string, action: 'hide' | 'restore') => void;
  isPending: boolean;
  t: ReturnType<typeof useAdminT>['t'];
  formatDateTime: ReturnType<typeof useAdminT>['formatDateTime'];
}) {
  return (
    <AdminEntityCard>
      <AdminEntityCardHeader
        title={review.customer?.full_name ?? t('technicians.detail.anonymous')}
        subtitle={t('reviews.forTechnician', {
          name: review.technician?.full_name ?? t('common.unknown'),
        })}
        badge={
          review.is_hidden ? (
            <Badge variant="outline" className="border-0 bg-gray-100 text-gray-600">
              {t('reviews.hidden')}
            </Badge>
          ) : (
            <AdminEntityCardMetaPill variant="success">{t('reviews.filters.visible')}</AdminEntityCardMetaPill>
          )
        }
      />

      <AdminEntityCardMeta className="mt-3">
        <ReviewRating rating={review.rating} />
      </AdminEntityCardMeta>

      {review.comment ? (
        <AdminEntityCardInfoBox className="mt-4" columns={1}>
          <p className="text-sm leading-relaxed text-[#0F172A]" dir="auto">
            {review.comment}
          </p>
        </AdminEntityCardInfoBox>
      ) : null}

      <AdminEntityCardMeta className="mt-3">
        <AdminEntityCardMetaPill variant="muted">
          <Calendar className="h-3 w-3 shrink-0" aria-hidden />
          {formatDateTime(review.created_at)}
        </AdminEntityCardMetaPill>
      </AdminEntityCardMeta>

      <AdminEntityCardActions>
        <AdminEntityCardActionsGroup>
          {activeModeration === review.id ? (
            <ReviewModerationPanel
              review={review}
              note={note}
              onNoteChange={onNoteChange}
              onModerate={() =>
                onModerate(review.id, review.is_hidden ? 'restore' : 'hide')
              }
              onCancel={onCancelModeration}
              isPending={isPending}
              t={t}
            />
          ) : (
            <AdminEntityCardPrimaryAction
              onClick={() => onStartModeration(review.id)}
              icon={review.is_hidden ? Eye : EyeOff}
            >
              {t('reviews.moderate')}
            </AdminEntityCardPrimaryAction>
          )}
        </AdminEntityCardActionsGroup>
      </AdminEntityCardActions>
    </AdminEntityCard>
  );
}

export default function AdminReviewsPage() {
  const { t, formatDateTime, dir } = useAdminT();
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [note, setNote] = useState('');
  const [activeModeration, setActiveModeration] = useState<string | null>(null);
  const iconMargin = dir === 'ltr' ? 'mr-1' : 'ml-1';

  const { data, isLoading, error } = useAdminReviews(filter, page);
  const moderate = useAdminModerateReview();

  const handleModerate = (reviewId: string, action: 'hide' | 'restore') => {
    moderate.mutate(
      { reviewId, action, note: note || undefined },
      {
        onSuccess: () => {
          setActiveModeration(null);
          setNote('');
        },
      },
    );
  };

  const filters = [
    { label: t('reviews.filters.all'), value: '' },
    { label: t('reviews.filters.visible'), value: 'false' },
    { label: t('reviews.filters.hidden'), value: 'true' },
  ];

  const filterValue = filter ?? '';

  return (
    <AdminListShell
      pageId="reviews"
      title={t('reviews.title')}
      subtitle={t('reviews.subtitle')}
      defaultView="table"
      cardsLayout="stack"
      skeletonClassName="h-24 w-full rounded-2xl"
      filters={
        <AdminFilterPills
          filters={filters}
          value={filterValue}
          onChange={(value) => {
            setFilter(value || undefined);
            setPage(1);
          }}
        />
      }
      isLoading={isLoading}
      error={error ? translateAdminError(error.message, t) : null}
      isEmpty={!data?.reviews.length}
      empty={<AdminEmptyState icon={Star} title={t('reviews.empty')} />}
      pagination={
        data ? (
          <AdminPagination
            page={page}
            totalPages={Math.ceil(data.total / data.limit)}
            total={data.total}
            onPageChange={setPage}
          />
        ) : null
      }
      table={
        <AdminPremiumTable>
          <AdminPremiumTableHead>
            <AdminPremiumTableHeaderCell>{t('tables.customer')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('tables.technician')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('tables.rating')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('tables.status')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell className="hidden md:table-cell">
              {t('tables.date')}
            </AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('tables.action')}</AdminPremiumTableHeaderCell>
          </AdminPremiumTableHead>
          <AdminPremiumTableBody>
            {data?.reviews.map((r: any) => (
              <AdminPremiumTableRow key={r.id}>
                <AdminPremiumTableCell className="font-medium text-[#0F172A]">
                  {r.customer?.full_name ?? t('technicians.detail.anonymous')}
                </AdminPremiumTableCell>
                <AdminPremiumTableCell className="text-[#64748B]">
                  {r.technician?.full_name ?? t('common.unknown')}
                </AdminPremiumTableCell>
                <AdminPremiumTableCell>
                  <ReviewRating rating={r.rating} />
                </AdminPremiumTableCell>
                <AdminPremiumTableCell>
                  {r.is_hidden ? (
                    <Badge variant="outline" className="bg-gray-100 text-gray-600">
                      {t('reviews.hidden')}
                    </Badge>
                  ) : (
                    <span className="text-[#64748B]">{t('reviews.filters.visible')}</span>
                  )}
                </AdminPremiumTableCell>
                <AdminPremiumTableCell className="hidden text-[#64748B] md:table-cell">
                  {formatDateTime(r.created_at)}
                </AdminPremiumTableCell>
                <AdminPremiumTableCell>
                  {activeModeration === r.id ? (
                    <ReviewModerationPanel
                      review={r}
                      note={note}
                      onNoteChange={setNote}
                      onModerate={() => handleModerate(r.id, r.is_hidden ? 'restore' : 'hide')}
                      onCancel={() => {
                        setActiveModeration(null);
                        setNote('');
                      }}
                      isPending={moderate.isPending}
                      t={t}
                    />
                  ) : (
                    <ReviewModerateButton
                      review={r}
                      onClick={() => setActiveModeration(r.id)}
                      t={t}
                      iconMargin={iconMargin}
                    />
                  )}
                </AdminPremiumTableCell>
              </AdminPremiumTableRow>
            ))}
          </AdminPremiumTableBody>
        </AdminPremiumTable>
      }
      cards={
        data?.reviews.map((r: any) => (
          <ReviewCard
            key={r.id}
            review={r}
            activeModeration={activeModeration}
            note={note}
            onNoteChange={setNote}
            onStartModeration={setActiveModeration}
            onCancelModeration={() => {
              setActiveModeration(null);
              setNote('');
            }}
            onModerate={handleModerate}
            isPending={moderate.isPending}
            t={t}
            formatDateTime={formatDateTime}
          />
        )) ?? null
      }
    />
  );
}

'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react';
import {
  useAdminHeroSlides,
  useAdminCreateHeroSlide,
  useAdminUpdateHeroSlide,
  useAdminDeleteHeroSlide,
  useAdminReorderHeroSlides,
} from '@/hooks/use-admin';
import { useCategories } from '@/hooks/use-categories';
import { useUpload } from '@/hooks/use-upload';
import { ImageUploader } from '@/components/shared/image-uploader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  AdminEntityCardIconButton,
  AdminEntityCardInfoBox,
  AdminEntityCardInfoRow,
  AdminEntityCardMeta,
  AdminEntityCardMetaPill,
  adminActionButtonClass,
  adminActionButtonDestructiveClass,
} from '@/components/admin/admin-list-chrome';
import { AdminListShell } from '@/components/admin/admin-list-shell';
import {
  Plus,
  Images,
  Pencil,
  Trash2,
  X,
  ChevronUp,
  ChevronDown,
  Check,
} from 'lucide-react';
import { categoryIconMap } from '@/lib/icons/category-icons';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { cn } from '@/lib/utils/cn';

const ICON_OPTIONS = Object.keys(categoryIconMap);

function HeroSlideActiveIcon({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Check className="h-4 w-4 text-green-600" />
  ) : (
    <X className="h-4 w-4 text-red-600" />
  );
}

function HeroSlideRowActions({
  slide,
  onEdit,
  onDelete,
  t,
}: {
  slide: any;
  onEdit: (slide: any) => void;
  onDelete: (id: string) => void;
  t: ReturnType<typeof useAdminT>['t'];
}) {
  return (
    <div className="flex items-center justify-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className={adminActionButtonClass}
        onClick={() => onEdit(slide)}
        aria-label={t('common.edit')}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={adminActionButtonDestructiveClass}
        onClick={() => {
          if (confirm(t('heroSlides.deleteConfirm'))) onDelete(slide.id);
        }}
        aria-label={t('common.delete')}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function HeroSlideReorderButtons({
  index,
  total,
  onMove,
  isPending,
}: {
  index: number;
  total: number;
  onMove: (direction: -1 | 1) => void;
  isPending: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className={adminActionButtonClass}
        disabled={index === 0 || isPending}
        onClick={() => onMove(-1)}
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={adminActionButtonClass}
        disabled={index === total - 1 || isPending}
        onClick={() => onMove(1)}
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );
}

function HeroSlideActiveBadge({ isActive, t }: { isActive: boolean; t: ReturnType<typeof useAdminT>['t'] }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        isActive
          ? 'border-emerald-200/80 bg-emerald-50 text-emerald-700'
          : 'border-red-200/80 bg-red-50 text-red-700',
      )}
    >
      {isActive ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {isActive ? t('common.active') : t('common.inactive')}
    </span>
  );
}

function HeroSlideCard({
  slide,
  index,
  total,
  t,
  onMove,
  onEdit,
  onDelete,
  onToggleActive,
  isReorderPending,
}: {
  slide: any;
  index: number;
  total: number;
  t: ReturnType<typeof useAdminT>['t'];
  onMove: (index: number, direction: -1 | 1) => void;
  onEdit: (slide: any) => void;
  onDelete: (id: string) => void;
  onToggleActive: (slide: any) => void;
  isReorderPending: boolean;
}) {
  return (
    <AdminEntityCard>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={slide.image_url}
        alt={slide.title_ar}
        className="mb-4 h-32 w-full rounded-xl border border-gray-100 object-cover"
      />

      <AdminEntityCardHeader
        title={
          <span dir="auto">{slide.title_ar}</span>
        }
        subtitle={
          <span dir="auto">{slide.subtitle_ar}</span>
        }
        badge={
          <button type="button" onClick={() => onToggleActive(slide)} className="shrink-0">
            <HeroSlideActiveBadge isActive={slide.is_active} t={t} />
          </button>
        }
      />

      <AdminEntityCardInfoBox className="mt-4">
        <AdminEntityCardInfoRow label={t('tables.icon')}>
          <span className="text-[#64748B]">{slide.icon_key ?? t('common.dash')}</span>
        </AdminEntityCardInfoRow>
        <AdminEntityCardInfoRow label={t('tables.order')}>
          <span className="font-semibold tabular-nums">{index + 1}</span>
        </AdminEntityCardInfoRow>
      </AdminEntityCardInfoBox>

      <AdminEntityCardMeta className="mt-3">
        <AdminEntityCardMetaPill variant="orange">
          #{index + 1} / {total}
        </AdminEntityCardMetaPill>
      </AdminEntityCardMeta>

      <AdminEntityCardActions>
        <AdminEntityCardActionsGroup>
          <AdminEntityCardIconButton
            icon={ChevronUp}
            label={t('heroSlides.moveUp')}
            variant="neutral"
            disabled={index === 0 || isReorderPending}
            onClick={() => onMove(index, -1)}
          />
          <AdminEntityCardIconButton
            icon={ChevronDown}
            label={t('heroSlides.moveDown')}
            variant="neutral"
            disabled={index === total - 1 || isReorderPending}
            onClick={() => onMove(index, 1)}
          />
          <AdminEntityCardIconButton
            icon={Pencil}
            label={t('common.edit')}
            variant="edit"
            onClick={() => onEdit(slide)}
          />
          <AdminEntityCardIconButton
            icon={Trash2}
            label={t('common.delete')}
            variant="destructive"
            onClick={() => {
              if (confirm(t('heroSlides.deleteConfirm'))) onDelete(slide.id);
            }}
          />
        </AdminEntityCardActionsGroup>
      </AdminEntityCardActions>
    </AdminEntityCard>
  );
}

export default function AdminHeroSlidesPage() {
  const { t, dir } = useAdminT();
  const { data: slides, isLoading } = useAdminHeroSlides();
  const { data: categories } = useCategories();
  const createSlide = useAdminCreateHeroSlide();
  const updateSlide = useAdminUpdateHeroSlide();
  const deleteSlide = useAdminDeleteHeroSlide();
  const reorderSlides = useAdminReorderHeroSlides();
  const upload = useUpload();

  const iconMargin = dir === 'ltr' ? 'mr-1' : 'ml-1';

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    image_url: '',
    title_ar: '',
    subtitle_ar: t('heroSlides.form.subtitlePlaceholder'),
    icon_key: 'zap',
    service_category_slug: '',
    is_active: true,
  });

  useEffect(() => {
    if (upload.uploadedUrls.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync uploaded URL into form
      setForm((prev) => ({ ...prev, image_url: upload.uploadedUrls[upload.uploadedUrls.length - 1] }));
    }
  }, [upload.uploadedUrls]);

  const resetForm = () => {
    setForm({
      image_url: '',
      title_ar: '',
      subtitle_ar: t('heroSlides.form.subtitlePlaceholder'),
      icon_key: 'zap',
      service_category_slug: '',
      is_active: true,
    });
    upload.reset();
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      service_category_slug: form.service_category_slug || null,
    };

    if (editingId) {
      updateSlide.mutate({ id: editingId, data: payload }, { onSuccess: resetForm });
    } else {
      createSlide.mutate(payload, { onSuccess: resetForm });
    }
  };

  const startEdit = (slide: any) => {
    setForm({
      image_url: slide.image_url,
      title_ar: slide.title_ar,
      subtitle_ar: slide.subtitle_ar ?? t('heroSlides.form.subtitlePlaceholder'),
      icon_key: slide.icon_key ?? 'zap',
      service_category_slug: slide.service_category_slug ?? '',
      is_active: slide.is_active,
    });
    upload.reset();
    setEditingId(slide.id);
    setShowForm(true);
  };

  const moveSlide = (index: number, direction: -1 | 1) => {
    if (!slides?.length) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= slides.length) return;
    const ordered = [...slides];
    [ordered[index], ordered[nextIndex]] = [ordered[nextIndex], ordered[index]];
    reorderSlides.mutate(ordered.map((slide: any) => slide.id));
  };

  const toggleActive = (slide: any) => {
    updateSlide.mutate({ id: slide.id, data: { is_active: !slide.is_active } });
  };

  const slideForm = showForm ? (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">
          {editingId ? t('heroSlides.edit') : t('heroSlides.new')}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={resetForm} aria-label={t('common.cancel')}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('heroSlides.form.slideImage')}</Label>
            <ImageUploader
              urls={form.image_url ? [form.image_url] : upload.uploadedUrls}
              onUpload={upload.uploadFile}
              onRemove={(url) => {
                upload.removeUrl(url);
                if (form.image_url === url) setForm({ ...form, image_url: '' });
              }}
              uploading={upload.uploading}
              maxFiles={1}
              error={upload.error}
            />
            {!form.image_url && (
              <Input
                placeholder={t('heroSlides.form.pasteUrl')}
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title_ar">{t('heroSlides.form.titleAr')}</Label>
              <Input
                id="title_ar"
                dir="auto"
                value={form.title_ar}
                onChange={(e) => setForm({ ...form, title_ar: e.target.value })}
                placeholder={t('heroSlides.form.titlePlaceholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle_ar">{t('heroSlides.form.subtitleAr')}</Label>
              <Input
                id="subtitle_ar"
                dir="auto"
                value={form.subtitle_ar}
                onChange={(e) => setForm({ ...form, subtitle_ar: e.target.value })}
                placeholder={t('heroSlides.form.subtitlePlaceholder')}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icon_key">{t('heroSlides.form.icon')}</Label>
              <select
                id="icon_key"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.icon_key}
                onChange={(e) => setForm({ ...form, icon_key: e.target.value })}
              >
                {ICON_OPTIONS.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category_slug">{t('heroSlides.form.categoryOptional')}</Label>
              <select
                id="category_slug"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.service_category_slug}
                onChange={(e) => setForm({ ...form, service_category_slug: e.target.value })}
              >
                <option value="">{t('heroSlides.form.none')}</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name_ar}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="is_active"
              checked={form.is_active}
              onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
            />
            <Label htmlFor="is_active">{t('heroSlides.form.active')}</Label>
          </div>

          <Button
            type="submit"
            disabled={
              !form.image_url ||
              createSlide.isPending ||
              updateSlide.isPending ||
              upload.uploading
            }
          >
            {editingId ? t('heroSlides.form.update') : t('heroSlides.form.create')}
          </Button>
        </form>
      </CardContent>
    </Card>
  ) : null;

  return (
    <AdminListShell
      pageId="hero-slides"
      title={t('heroSlides.title')}
      subtitle={t('heroSlides.subtitle')}
      defaultView="table"
      headerActions={
        <Button onClick={() => { resetForm(); setShowForm(true); }} disabled={showForm}>
          <Plus className={cn('h-4 w-4', iconMargin)} /> {t('heroSlides.add')}
        </Button>
      }
      beforeContent={slideForm}
      skeletonCount={3}
      skeletonClassName="h-20 w-full rounded-2xl"
      isLoading={isLoading}
      isEmpty={!slides?.length}
      empty={<AdminEmptyState icon={Images} title={t('heroSlides.empty')} />}
      cardsLayout="grid"
      table={
        <AdminPremiumTable>
          <AdminPremiumTableHead>
            <AdminPremiumTableHeaderCell>{t('tables.order')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('tables.preview')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('tables.title')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('tables.subtitle')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('tables.icon')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('common.active')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('common.actions')}</AdminPremiumTableHeaderCell>
          </AdminPremiumTableHead>
          <AdminPremiumTableBody>
            {slides?.map((slide: any, index: number) => (
              <AdminPremiumTableRow key={slide.id}>
                <AdminPremiumTableCell>
                  <HeroSlideReorderButtons
                    index={index}
                    total={slides.length}
                    onMove={(dir) => moveSlide(index, dir)}
                    isPending={reorderSlides.isPending}
                  />
                </AdminPremiumTableCell>
                <AdminPremiumTableCell>
                  <img
                    src={slide.image_url}
                    alt={slide.title_ar}
                    className="mx-auto h-14 w-20 rounded-md object-cover"
                  />
                </AdminPremiumTableCell>
                <AdminPremiumTableCell className="font-medium text-[#0F172A]" dir="auto">
                  {slide.title_ar}
                </AdminPremiumTableCell>
                <AdminPremiumTableCell className="text-[#64748B]" dir="auto">
                  {slide.subtitle_ar}
                </AdminPremiumTableCell>
                <AdminPremiumTableCell className="text-[#64748B]">
                  {slide.icon_key ?? t('common.dash')}
                </AdminPremiumTableCell>
                <AdminPremiumTableCell>
                  <button
                    type="button"
                    className="mx-auto block"
                    onClick={() => toggleActive(slide)}
                    aria-label={t('heroSlides.form.active')}
                  >
                    <HeroSlideActiveIcon isActive={slide.is_active} />
                  </button>
                </AdminPremiumTableCell>
                <AdminPremiumTableCell>
                  <HeroSlideRowActions
                    slide={slide}
                    onEdit={startEdit}
                    onDelete={(id) => deleteSlide.mutate(id)}
                    t={t}
                  />
                </AdminPremiumTableCell>
              </AdminPremiumTableRow>
            ))}
          </AdminPremiumTableBody>
        </AdminPremiumTable>
      }
      cards={
        slides?.map((slide: any, index: number) => (
          <HeroSlideCard
            key={slide.id}
            slide={slide}
            index={index}
            total={slides.length}
            t={t}
            onMove={moveSlide}
            onEdit={startEdit}
            onDelete={(id) => deleteSlide.mutate(id)}
            onToggleActive={toggleActive}
            isReorderPending={reorderSlides.isPending}
          />
        )) ?? null
      }
    />
  );
}

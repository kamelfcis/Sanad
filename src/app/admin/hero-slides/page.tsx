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
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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

export default function AdminHeroSlidesPage() {
  const { t, dir } = useAdminT();
  const { data: slides, isLoading } = useAdminHeroSlides();
  const { data: categories } = useCategories();
  const createSlide = useAdminCreateHeroSlide();
  const updateSlide = useAdminUpdateHeroSlide();
  const deleteSlide = useAdminDeleteHeroSlide();
  const reorderSlides = useAdminReorderHeroSlides();
  const upload = useUpload();

  const textAlign = dir === 'ltr' ? 'text-left' : '';
  const iconMargin = dir === 'ltr' ? 'mr-1' : 'ml-1';
  const actionsAlign = dir === 'ltr' ? 'text-right' : 'text-end';

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

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('heroSlides.title')}</h1>
          <p className="mt-1 text-muted-foreground">{t('heroSlides.subtitle')}</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} disabled={showForm}>
          <Plus className={cn('h-4 w-4', iconMargin)} /> {t('heroSlides.add')}
        </Button>
      </div>

      {showForm && (
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
                      <option key={key} value={key}>{key}</option>
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
                      <option key={category.id} value={category.slug}>{category.name_ar}</option>
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
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : !slides?.length ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Images className="h-12 w-12 text-muted-foreground/50" />
          <h2 className="text-lg font-semibold">{t('heroSlides.empty')}</h2>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <table className={cn('w-full text-sm', textAlign)}>
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 font-medium">{t('tables.order')}</th>
                <th className="px-4 py-3 font-medium">{t('tables.preview')}</th>
                <th className="px-4 py-3 font-medium">{t('tables.title')}</th>
                <th className="px-4 py-3 font-medium">{t('tables.subtitle')}</th>
                <th className="px-4 py-3 font-medium">{t('tables.icon')}</th>
                <th className="px-4 py-3 font-medium">{t('common.active')}</th>
                <th className={cn('px-4 py-3 font-medium', actionsAlign)}>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {slides.map((slide: any, index: number) => (
                <tr key={slide.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={index === 0 || reorderSlides.isPending}
                        onClick={() => moveSlide(index, -1)}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={index === slides.length - 1 || reorderSlides.isPending}
                        onClick={() => moveSlide(index, 1)}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <img
                      src={slide.image_url}
                      alt={slide.title_ar}
                      className="h-14 w-20 rounded-md object-cover"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium" dir="auto">{slide.title_ar}</td>
                  <td className="px-4 py-3 text-muted-foreground" dir="auto">{slide.subtitle_ar}</td>
                  <td className="px-4 py-3 text-muted-foreground">{slide.icon_key ?? t('common.dash')}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => toggleActive(slide)} aria-label={t('heroSlides.form.active')}>
                      {slide.is_active ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-red-600" />
                      )}
                    </button>
                  </td>
                  <td className={cn('px-4 py-3', actionsAlign)}>
                    <Button variant="ghost" size="icon" onClick={() => startEdit(slide)} aria-label={t('common.edit')}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm(t('heroSlides.deleteConfirm'))) deleteSlide.mutate(slide.id);
                      }}
                      aria-label={t('common.delete')}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

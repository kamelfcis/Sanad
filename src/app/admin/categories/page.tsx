'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react';
import {
  useAdminCategories,
  useAdminCreateCategory,
  useAdminUpdateCategory,
  useAdminDeleteCategory,
} from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  AdminEntityCardIconButton,
  AdminEntityCardInfoBox,
  AdminEntityCardInfoRow,
  AdminEntityCardMeta,
  AdminEntityCardMetaPill,
  AdminEntityCardPrimaryAction,
  adminActionButtonClass,
  adminActionButtonDestructiveClass,
} from '@/components/admin/admin-list-chrome';
import { AdminListShell } from '@/components/admin/admin-list-shell';
import { AdminPagination } from '@/components/admin/admin-pagination';
import { CategoryIconPicker } from '@/components/admin/category-icon-picker';
import { CategoryIconDisplay } from '@/components/shared/category-icon-display';
import { resolveCategoryIconType, type CategoryIconType } from '@/lib/icons/category-icons';
import { Plus, FolderTree, Pencil, Trash2, X, Check, Hash } from 'lucide-react';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { useAdminListPagination } from '@/hooks/use-admin-list-pagination';
import { asAdminListItems } from '@/lib/admin/list-items';
import { cn } from '@/lib/utils/cn';

function CategoryActiveIcon({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Check className="mx-auto h-4 w-4 text-green-600" />
  ) : (
    <X className="mx-auto h-4 w-4 text-red-600" />
  );
}

function CategoryRowActions({
  category,
  onEdit,
  onDelete,
  t,
}: {
  category: any;
  onEdit: (category: any) => void;
  onDelete: (id: string) => void;
  t: ReturnType<typeof useAdminT>['t'];
}) {
  return (
    <div className="flex items-center justify-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className={adminActionButtonClass}
        onClick={() => onEdit(category)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={adminActionButtonDestructiveClass}
        onClick={() => {
          if (confirm(t('categories.deleteConfirm'))) onDelete(category.id);
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function CategoryActiveBadge({ isActive, t }: { isActive: boolean; t: ReturnType<typeof useAdminT>['t'] }) {
  return (
    <AdminEntityCardMetaPill variant={isActive ? 'success' : 'danger'}>
      {isActive ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {isActive ? t('common.active') : t('common.inactive')}
    </AdminEntityCardMetaPill>
  );
}

function CategoryCardActions({
  category,
  onEdit,
  onDelete,
  t,
}: {
  category: any;
  onEdit: (category: any) => void;
  onDelete: (id: string) => void;
  t: ReturnType<typeof useAdminT>['t'];
}) {
  return (
    <>
      <AdminEntityCardIconButton
        icon={Pencil}
        label={t('common.edit')}
        variant="edit"
        onClick={() => onEdit(category)}
      />
      <AdminEntityCardIconButton
        icon={Trash2}
        label={t('common.delete')}
        variant="destructive"
        onClick={() => {
          if (confirm(t('categories.deleteConfirm'))) onDelete(category.id);
        }}
      />
    </>
  );
}

function CategoryAdminCard({
  category,
  t,
  onEdit,
  onDelete,
}: {
  category: any;
  t: ReturnType<typeof useAdminT>['t'];
  onEdit: (category: any) => void;
  onDelete: (id: string) => void;
}) {
  const iconType = resolveCategoryIconType(category.icon, category.icon_type);

  return (
    <div data-testid={`category-card-${category.slug}`}>
      <AdminEntityCard>
      <AdminEntityCardHeader
        title={<span dir="auto">{category.name_ar}</span>}
        subtitle={category.name_en}
        avatar={
          <CategoryIconDisplay
            icon={category.icon}
            iconType={iconType}
            alt={category.name_en}
            size="lg"
            variant="avatar"
          />
        }
        badge={<CategoryActiveBadge isActive={category.is_active} t={t} />}
      />

      <AdminEntityCardInfoBox className="mt-4">
        <AdminEntityCardInfoRow label={t('tables.slug')}>
          <span className="font-mono text-sm text-[#64748B]" dir="ltr">
            {category.slug}
          </span>
        </AdminEntityCardInfoRow>
        <AdminEntityCardInfoRow label={t('tables.nameEn')}>
          <span className="text-[#64748B]">{category.name_en}</span>
        </AdminEntityCardInfoRow>
        {category.description ? (
          <AdminEntityCardInfoRow label={t('categories.form.description')} fullWidth>
            <span className="line-clamp-2 text-[#64748B]">{category.description}</span>
          </AdminEntityCardInfoRow>
        ) : null}
      </AdminEntityCardInfoBox>

      <AdminEntityCardMeta className="mt-3">
        <AdminEntityCardMetaPill variant="orange">
          <Hash className="h-3 w-3 shrink-0" aria-hidden />
          {iconType === 'upload' ? t('categories.form.upload') : category.icon ?? t('common.dash')}
        </AdminEntityCardMetaPill>
      </AdminEntityCardMeta>

      <AdminEntityCardActions>
        <AdminEntityCardActionsGroup>
          <CategoryCardActions category={category} onEdit={onEdit} onDelete={onDelete} t={t} />
        </AdminEntityCardActionsGroup>
        <AdminEntityCardPrimaryAction icon={Pencil} onClick={() => onEdit(category)}>
          {t('common.edit')}
        </AdminEntityCardPrimaryAction>
      </AdminEntityCardActions>
    </AdminEntityCard>
    </div>
  );
}

interface CategoryFormState {
  name_ar: string;
  name_en: string;
  slug: string;
  description: string;
  icon: string;
  icon_type: CategoryIconType;
}

export default function AdminCategoriesPage() {
  const { t, dir } = useAdminT();
  const { page, limit, setPage, setLimit } = useAdminListPagination();
  const { data, isLoading } = useAdminCategories(page, limit);
  const categories = asAdminListItems(data, 'categories');
  const createCategory = useAdminCreateCategory();
  const updateCategory = useAdminUpdateCategory();
  const deleteCategory = useAdminDeleteCategory();
  const iconMargin = dir === 'ltr' ? 'mr-1' : 'ml-1';

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormState>({
    name_ar: '',
    name_en: '',
    slug: '',
    description: '',
    icon: 'snowflake',
    icon_type: 'preset',
  });

  const resetForm = () => {
    setForm({
      name_ar: '',
      name_en: '',
      slug: '',
      description: '',
      icon: 'snowflake',
      icon_type: 'preset',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      description: form.description || null,
      icon: form.icon || null,
    };

    if (editingId) {
      updateCategory.mutate({ id: editingId, data: payload }, { onSuccess: resetForm });
    } else {
      createCategory.mutate(payload, { onSuccess: resetForm });
    }
  };

  const startEdit = (c: any) => {
    setForm({
      name_ar: c.name_ar,
      name_en: c.name_en,
      slug: c.slug,
      description: c.description ?? '',
      icon: c.icon ?? 'snowflake',
      icon_type: resolveCategoryIconType(c.icon, c.icon_type),
    });
    setEditingId(c.id);
    setShowForm(true);
  };

  const categoryForm = showForm ? (
    <Card className="mb-6" data-testid="category-form">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">
          {editingId ? t('categories.edit') : t('categories.new')}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={resetForm} aria-label={t('common.cancel')}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name_ar">{t('categories.form.nameAr')}</Label>
              <Input
                id="name_ar"
                data-testid="category-name-ar"
                value={form.name_ar}
                onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name_en">{t('categories.form.nameEn')}</Label>
              <Input
                id="name_en"
                data-testid="category-name-en"
                value={form.name_en}
                onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">{t('categories.form.slug')}</Label>
            <Input
              id="slug"
              data-testid="category-slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">{t('categories.form.description')}</Label>
            <Textarea
              id="desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <CategoryIconPicker
            icon={form.icon}
            iconType={form.icon_type}
            onChange={({ icon, iconType }) => setForm({ ...form, icon, icon_type: iconType })}
            labels={{
              title: t('categories.form.icon'),
              preset: t('categories.form.preset'),
              upload: t('categories.form.upload'),
              search: t('categories.form.iconSearch'),
              preview: t('categories.form.iconPreview'),
              uploadHint: t('categories.form.uploadHint'),
              uploading: t('categories.form.uploading'),
              remove: t('categories.form.removeIcon'),
            }}
          />

          <Button
            type="submit"
            data-testid="category-submit"
            disabled={createCategory.isPending || updateCategory.isPending}
          >
            {editingId ? t('categories.form.update') : t('categories.form.create')}{' '}
            {t('categories.title')}
          </Button>
        </form>
      </CardContent>
    </Card>
  ) : null;

  return (
    <AdminListShell
      pageId="categories"
      title={t('categories.title')}
      subtitle={t('categories.subtitle')}
      defaultView="table"
      headerActions={
        <Button
          data-testid="category-add-button"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          disabled={showForm}
        >
          <Plus className={cn('h-4 w-4', iconMargin)} /> {t('categories.add')}
        </Button>
      }
      beforeContent={categoryForm}
      isLoading={isLoading}
      isEmpty={!categories?.length}
      empty={<AdminEmptyState icon={FolderTree} title={t('categories.empty')} />}
      cardsLayout="grid"
      pagination={
        data ? (
          <AdminPagination
            page={page}
            totalPages={Math.max(1, Math.ceil(data.total / data.limit))}
            total={data.total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        ) : null
      }
      table={
        <AdminPremiumTable>
          <AdminPremiumTableHead>
            <AdminPremiumTableHeaderCell>{t('tables.icon')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('tables.nameAr')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('tables.nameEn')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('tables.slug')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('common.active')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('common.actions')}</AdminPremiumTableHeaderCell>
          </AdminPremiumTableHead>
          <AdminPremiumTableBody>
            {categories?.map((c: any) => (
              <AdminPremiumTableRow key={c.id}>
                <AdminPremiumTableCell>
                  <CategoryIconDisplay
                    icon={c.icon}
                    iconType={resolveCategoryIconType(c.icon, c.icon_type)}
                    size="md"
                    variant="avatar"
                  />
                </AdminPremiumTableCell>
                <AdminPremiumTableCell className="font-medium text-[#0F172A]" dir="auto">
                  {c.name_ar}
                </AdminPremiumTableCell>
                <AdminPremiumTableCell className="text-[#64748B]">{c.name_en}</AdminPremiumTableCell>
                <AdminPremiumTableCell className="text-[#64748B]" dir="ltr">
                  {c.slug}
                </AdminPremiumTableCell>
                <AdminPremiumTableCell>
                  <CategoryActiveIcon isActive={c.is_active} />
                </AdminPremiumTableCell>
                <AdminPremiumTableCell>
                  <CategoryRowActions
                    category={c}
                    onEdit={startEdit}
                    onDelete={(id) => deleteCategory.mutate(id)}
                    t={t}
                  />
                </AdminPremiumTableCell>
              </AdminPremiumTableRow>
            ))}
          </AdminPremiumTableBody>
        </AdminPremiumTable>
      }
      cards={
        categories?.map((c: any) => (
          <CategoryAdminCard
            key={c.id}
            category={c}
            t={t}
            onEdit={startEdit}
            onDelete={(id) => deleteCategory.mutate(id)}
          />
        )) ?? null
      }
    />
  );
}

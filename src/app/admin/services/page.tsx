'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react';
import {
  useAdminServices,
  useAdminCreateService,
  useAdminUpdateService,
  useAdminDeleteService,
} from '@/hooks/use-admin';
import { useCategories } from '@/hooks/use-categories';
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
  AdminEntityCardTagPill,
  adminActionButtonClass,
  adminActionButtonDestructiveClass,
} from '@/components/admin/admin-list-chrome';
import { AdminListShell } from '@/components/admin/admin-list-shell';
import { AdminPagination } from '@/components/admin/admin-pagination';
import { Plus, Wrench, Pencil, Trash2, X, Check } from 'lucide-react';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { useAdminListPagination } from '@/hooks/use-admin-list-pagination';
import { asAdminListItems } from '@/lib/admin/list-items';
import { cn } from '@/lib/utils/cn';

function ServiceActiveIcon({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Check className="mx-auto h-4 w-4 text-green-600" />
  ) : (
    <X className="mx-auto h-4 w-4 text-red-600" />
  );
}

function ServicePriceDisplay({
  service,
  priceTypeLabel,
  t,
  formatCurrency,
}: {
  service: any;
  priceTypeLabel: (type: string) => string;
  t: ReturnType<typeof useAdminT>['t'];
  formatCurrency: ReturnType<typeof useAdminT>['formatCurrency'];
}) {
  return (
    <>
      {service.price ? formatCurrency(Number(service.price)) : t('common.dash')}
      <span className="ms-1 text-xs text-[#64748B]">/{priceTypeLabel(service.price_type)}</span>
    </>
  );
}

function ServiceRowActions({
  service,
  onEdit,
  onDelete,
  t,
}: {
  service: any;
  onEdit: (service: any) => void;
  onDelete: (id: string) => void;
  t: ReturnType<typeof useAdminT>['t'];
}) {
  return (
    <div className="flex items-center justify-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className={adminActionButtonClass}
        onClick={() => onEdit(service)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={adminActionButtonDestructiveClass}
        onClick={() => {
          if (confirm(t('services.deleteConfirm'))) onDelete(service.id);
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function serviceCategoryName(
  category: { name_ar?: string; name_en?: string } | null | undefined,
  locale: ReturnType<typeof useAdminT>['locale'],
): string | null {
  if (!category) return null;
  return locale === 'ar' ? (category.name_ar ?? category.name_en ?? null) : (category.name_en ?? category.name_ar ?? null);
}

function ServiceCardActions({
  service,
  onEdit,
  onDelete,
  t,
}: {
  service: any;
  onEdit: (service: any) => void;
  onDelete: (id: string) => void;
  t: ReturnType<typeof useAdminT>['t'];
}) {
  return (
    <>
      <AdminEntityCardIconButton
        icon={Pencil}
        label={t('common.edit')}
        variant="edit"
        onClick={() => onEdit(service)}
      />
      <AdminEntityCardIconButton
        icon={Trash2}
        label={t('common.delete')}
        variant="destructive"
        onClick={() => {
          if (confirm(t('services.deleteConfirm'))) onDelete(service.id);
        }}
      />
    </>
  );
}

function ServiceCard({
  service,
  t,
  locale,
  priceTypeLabel,
  formatCurrency,
  onEdit,
  onDelete,
}: {
  service: any;
  t: ReturnType<typeof useAdminT>['t'];
  locale: ReturnType<typeof useAdminT>['locale'];
  priceTypeLabel: (type: string) => string;
  formatCurrency: ReturnType<typeof useAdminT>['formatCurrency'];
  onEdit: (service: any) => void;
  onDelete: (id: string) => void;
}) {
  const categoryLabel = serviceCategoryName(service.service_categories, locale);

  return (
    <AdminEntityCard>
      <AdminEntityCardHeader
        title={<span dir="auto">{service.name_ar}</span>}
        subtitle={service.name_en ?? t('services.card.subtitle')}
        badge={
          <AdminEntityCardMetaPill variant={service.is_active ? 'success' : 'danger'}>
            {service.is_active ? t('common.active') : t('common.inactive')}
          </AdminEntityCardMetaPill>
        }
      />

      {categoryLabel ? (
        <AdminEntityCardMeta className="mt-3">
          <AdminEntityCardTagPill>{categoryLabel}</AdminEntityCardTagPill>
        </AdminEntityCardMeta>
      ) : null}

      <AdminEntityCardInfoBox className="mt-4" columns={1}>
        <AdminEntityCardInfoRow label={t('tables.price')}>
          <span className="font-semibold">
            <ServicePriceDisplay
              service={service}
              priceTypeLabel={priceTypeLabel}
              t={t}
              formatCurrency={formatCurrency}
            />
          </span>
        </AdminEntityCardInfoRow>
      </AdminEntityCardInfoBox>

      <AdminEntityCardActions>
        <AdminEntityCardActionsGroup>
          <ServiceCardActions service={service} onEdit={onEdit} onDelete={onDelete} t={t} />
        </AdminEntityCardActionsGroup>
        <AdminEntityCardPrimaryAction icon={Pencil} onClick={() => onEdit(service)}>
          {t('common.edit')}
        </AdminEntityCardPrimaryAction>
      </AdminEntityCardActions>
    </AdminEntityCard>
  );
}

export default function AdminServicesPage() {
  const { t, dir, locale, formatCurrency } = useAdminT();
  const { page, limit, setPage, setLimit } = useAdminListPagination();
  const { data, isLoading } = useAdminServices(page, limit);
  const services = asAdminListItems(data, 'services');
  const { data: categories } = useCategories();
  const createService = useAdminCreateService();
  const updateService = useAdminUpdateService();
  const deleteService = useAdminDeleteService();
  const iconMargin = dir === 'ltr' ? 'mr-1' : 'ml-1';

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    category_id: '',
    name_ar: '',
    name_en: '',
    slug: '',
    description: '',
    price: '',
    price_type: 'fixed',
  });

  const resetForm = () => {
    setForm({
      category_id: '',
      name_ar: '',
      name_en: '',
      slug: '',
      description: '',
      price: '',
      price_type: 'fixed',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, price: form.price ? Number(form.price) : null };
    if (editingId) {
      updateService.mutate({ id: editingId, data }, { onSuccess: resetForm });
    } else {
      createService.mutate(data, { onSuccess: resetForm });
    }
  };

  const startEdit = (s: any) => {
    setForm({
      category_id: s.category_id,
      name_ar: s.name_ar,
      name_en: s.name_en,
      slug: s.slug,
      description: s.description ?? '',
      price: s.price?.toString() ?? '',
      price_type: s.price_type,
    });
    setEditingId(s.id);
    setShowForm(true);
  };

  const priceTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      fixed: t('services.form.fixed'),
      hourly: t('services.form.hourly'),
      estimate: t('services.form.estimate'),
    };
    return map[type] ?? type;
  };

  const serviceForm = showForm ? (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">
          {editingId ? t('services.edit') : t('services.new')}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={resetForm}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name_ar">{t('services.form.nameAr')}</Label>
              <Input
                id="name_ar"
                value={form.name_ar}
                onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name_en">{t('services.form.nameEn')}</Label>
              <Input
                id="name_en"
                value={form.name_en}
                onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">{t('services.form.slug')}</Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">{t('services.form.description')}</Label>
            <Textarea
              id="desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cat">{t('services.form.category')}</Label>
              <select
                id="cat"
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">{t('services.form.selectCategory')}</option>
                {categories?.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name_ar} / {c.name_en}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">{t('services.form.price')}</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ptype">{t('services.form.priceType')}</Label>
              <select
                id="ptype"
                value={form.price_type}
                onChange={(e) => setForm({ ...form, price_type: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="fixed">{t('services.form.fixed')}</option>
                <option value="hourly">{t('services.form.hourly')}</option>
                <option value="estimate">{t('services.form.estimate')}</option>
              </select>
            </div>
          </div>
          <Button type="submit" disabled={createService.isPending || updateService.isPending}>
            {editingId ? t('services.form.update') : t('services.form.create')} {t('services.title')}
          </Button>
        </form>
      </CardContent>
    </Card>
  ) : null;

  return (
    <AdminListShell
      pageId="services"
      title={t('services.title')}
      subtitle={t('services.subtitle')}
      defaultView="table"
      headerActions={
        <Button onClick={() => { resetForm(); setShowForm(true); }} disabled={showForm}>
          <Plus className={cn('h-4 w-4', iconMargin)} /> {t('services.add')}
        </Button>
      }
      beforeContent={serviceForm}
      isLoading={isLoading}
      isEmpty={!services?.length}
      empty={
        <AdminEmptyState
          icon={Wrench}
          title={t('services.empty.title')}
          subtitle={t('services.empty.subtitle')}
        />
      }
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
            <AdminPremiumTableHeaderCell>{t('tables.nameAr')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('tables.nameEn')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('tables.category')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('tables.price')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('common.active')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('common.actions')}</AdminPremiumTableHeaderCell>
          </AdminPremiumTableHead>
          <AdminPremiumTableBody>
            {services?.map((s: any) => (
              <AdminPremiumTableRow key={s.id}>
                <AdminPremiumTableCell className="font-medium text-[#0F172A]" dir="auto">
                  {s.name_ar}
                </AdminPremiumTableCell>
                <AdminPremiumTableCell className="text-[#64748B]">{s.name_en}</AdminPremiumTableCell>
                <AdminPremiumTableCell className="text-[#64748B]">
                  {s.service_categories?.name_en ?? t('common.dash')}
                </AdminPremiumTableCell>
                <AdminPremiumTableCell className="text-[#0F172A]">
                  <ServicePriceDisplay service={s} priceTypeLabel={priceTypeLabel} t={t} formatCurrency={formatCurrency} />
                </AdminPremiumTableCell>
                <AdminPremiumTableCell>
                  <ServiceActiveIcon isActive={s.is_active} />
                </AdminPremiumTableCell>
                <AdminPremiumTableCell>
                  <ServiceRowActions
                    service={s}
                    onEdit={startEdit}
                    onDelete={(id) => deleteService.mutate(id)}
                    t={t}
                  />
                </AdminPremiumTableCell>
              </AdminPremiumTableRow>
            ))}
          </AdminPremiumTableBody>
        </AdminPremiumTable>
      }
      cards={
        services?.map((s: any) => (
          <ServiceCard
            key={s.id}
            service={s}
            t={t}
            locale={locale}
            priceTypeLabel={priceTypeLabel}
            formatCurrency={formatCurrency}
            onEdit={startEdit}
            onDelete={(id) => deleteService.mutate(id)}
          />
        )) ?? null
      }
    />
  );
}

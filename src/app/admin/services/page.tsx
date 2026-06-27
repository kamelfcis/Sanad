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
  AdminEntityCardField,
  adminActionButtonClass,
  adminActionButtonDestructiveClass,
} from '@/components/admin/admin-list-chrome';
import { AdminListShell } from '@/components/admin/admin-list-shell';
import { Plus, Wrench, Pencil, Trash2, X, Check } from 'lucide-react';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
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
}: {
  service: any;
  priceTypeLabel: (type: string) => string;
  t: ReturnType<typeof useAdminT>['t'];
}) {
  return (
    <>
      {service.price ? `SAR ${service.price}` : t('common.dash')}
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

function ServiceCard({
  service,
  t,
  priceTypeLabel,
  onEdit,
  onDelete,
}: {
  service: any;
  t: ReturnType<typeof useAdminT>['t'];
  priceTypeLabel: (type: string) => string;
  onEdit: (service: any) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <AdminEntityCard>
      <AdminEntityCardField label={t('tables.nameAr')}>
        <span className="font-medium text-[#0F172A]" dir="auto">
          {service.name_ar}
        </span>
      </AdminEntityCardField>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <AdminEntityCardField label={t('tables.nameEn')}>
          <span className="text-[#64748B]">{service.name_en}</span>
        </AdminEntityCardField>
        <AdminEntityCardField label={t('tables.category')}>
          <span className="text-[#64748B]">
            {service.service_categories?.name_en ?? t('common.dash')}
          </span>
        </AdminEntityCardField>
        <AdminEntityCardField label={t('tables.price')}>
          <span className="text-[#0F172A]">
            <ServicePriceDisplay service={service} priceTypeLabel={priceTypeLabel} t={t} />
          </span>
        </AdminEntityCardField>
        <AdminEntityCardField label={t('common.active')}>
          <ServiceActiveIcon isActive={service.is_active} />
        </AdminEntityCardField>
      </div>
      <AdminEntityCardActions>
        <ServiceRowActions service={service} onEdit={onEdit} onDelete={onDelete} t={t} />
      </AdminEntityCardActions>
    </AdminEntityCard>
  );
}

export default function AdminServicesPage() {
  const { t, dir } = useAdminT();
  const { data: services, isLoading } = useAdminServices();
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
                  <ServicePriceDisplay service={s} priceTypeLabel={priceTypeLabel} t={t} />
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
            priceTypeLabel={priceTypeLabel}
            onEdit={startEdit}
            onDelete={(id) => deleteService.mutate(id)}
          />
        )) ?? null
      }
    />
  );
}

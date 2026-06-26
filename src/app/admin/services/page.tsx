'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react';
import { useAdminServices, useAdminCreateService, useAdminUpdateService, useAdminDeleteService } from '@/hooks/use-admin';
import { useCategories } from '@/hooks/use-categories';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Wrench, Pencil, Trash2, X, Check } from 'lucide-react';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { cn } from '@/lib/utils/cn';

export default function AdminServicesPage() {
  const { t, dir } = useAdminT();
  const { data: services, isLoading } = useAdminServices();
  const { data: categories } = useCategories();
  const createService = useAdminCreateService();
  const updateService = useAdminUpdateService();
  const deleteService = useAdminDeleteService();
  const textAlign = dir === 'ltr' ? 'text-left' : '';
  const iconMargin = dir === 'ltr' ? 'mr-1' : 'ml-1';

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ category_id: '', name_ar: '', name_en: '', slug: '', description: '', price: '', price_type: 'fixed' });

  const resetForm = () => {
    setForm({ category_id: '', name_ar: '', name_en: '', slug: '', description: '', price: '', price_type: 'fixed' });
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

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('services.title')}</h1>
          <p className="mt-1 text-muted-foreground">{t('services.subtitle')}</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} disabled={showForm}>
          <Plus className={cn('h-4 w-4', iconMargin)} /> {t('services.add')}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">{editingId ? t('services.edit') : t('services.new')}</CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name_ar">{t('services.form.nameAr')}</Label>
                  <Input id="name_ar" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_en">{t('services.form.nameEn')}</Label>
                  <Input id="name_en" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">{t('services.form.slug')}</Label>
                <Input id="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">{t('services.form.description')}</Label>
                <Textarea id="desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cat">{t('services.form.category')}</Label>
                  <select id="cat" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                    <option value="">{t('services.form.selectCategory')}</option>
                    {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name_ar} / {c.name_en}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">{t('services.form.price')}</Label>
                  <Input id="price" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ptype">{t('services.form.priceType')}</Label>
                  <select id="ptype" value={form.price_type} onChange={(e) => setForm({ ...form, price_type: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
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
      )}

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : !services?.length ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Wrench className="h-12 w-12 text-muted-foreground/50" />
          <h2 className="text-lg font-semibold">{t('services.empty.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('services.empty.subtitle')}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <table className={cn('w-full text-sm', textAlign)}>
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 font-medium">{t('tables.nameAr')}</th>
                <th className="px-4 py-3 font-medium">{t('tables.nameEn')}</th>
                <th className="px-4 py-3 font-medium">{t('tables.category')}</th>
                <th className="px-4 py-3 font-medium">{t('tables.price')}</th>
                <th className="px-4 py-3 font-medium">{t('common.active')}</th>
                <th className="px-4 py-3 text-end font-medium">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s: any) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium" dir="auto">{s.name_ar}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.name_en}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.service_categories?.name_en ?? t('common.dash')}</td>
                  <td className="px-4 py-3">
                    {s.price ? `SAR ${s.price}` : t('common.dash')}
                    <span className="ms-1 text-xs text-muted-foreground">/{priceTypeLabel(s.price_type)}</span>
                  </td>
                  <td className="px-4 py-3">
                    {s.is_active ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-600" />}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(s)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm(t('services.deleteConfirm'))) deleteService.mutate(s.id); }}>
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

'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react';
import { useAdminCategories, useAdminCreateCategory, useAdminUpdateCategory, useAdminDeleteCategory } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, FolderTree, Pencil, Trash2, X, Check } from 'lucide-react';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { cn } from '@/lib/utils/cn';

export default function AdminCategoriesPage() {
  const { t, dir } = useAdminT();
  const { data: categories, isLoading } = useAdminCategories();
  const createCategory = useAdminCreateCategory();
  const updateCategory = useAdminUpdateCategory();
  const deleteCategory = useAdminDeleteCategory();
  const textAlign = dir === 'ltr' ? 'text-left' : '';
  const iconMargin = dir === 'ltr' ? 'mr-1' : 'ml-1';

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name_ar: '', name_en: '', slug: '', description: '', icon: '' });

  const resetForm = () => {
    setForm({ name_ar: '', name_en: '', slug: '', description: '', icon: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateCategory.mutate({ id: editingId, data: form }, { onSuccess: resetForm });
    } else {
      createCategory.mutate(form, { onSuccess: resetForm });
    }
  };

  const startEdit = (c: any) => {
    setForm({ name_ar: c.name_ar, name_en: c.name_en, slug: c.slug, description: c.description ?? '', icon: c.icon ?? '' });
    setEditingId(c.id);
    setShowForm(true);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('categories.title')}</h1>
          <p className="mt-1 text-muted-foreground">{t('categories.subtitle')}</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} disabled={showForm}>
          <Plus className={cn('h-4 w-4', iconMargin)} /> {t('categories.add')}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">{editingId ? t('categories.edit') : t('categories.new')}</CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name_ar">{t('categories.form.nameAr')}</Label>
                  <Input id="name_ar" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_en">{t('categories.form.nameEn')}</Label>
                  <Input id="name_en" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">{t('categories.form.slug')}</Label>
                <Input id="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">{t('categories.form.description')}</Label>
                <Textarea id="desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">{t('categories.form.icon')}</Label>
                <Input id="icon" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
              </div>
              <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
                {editingId ? t('categories.form.update') : t('categories.form.create')} {t('categories.title')}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : !categories?.length ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <FolderTree className="h-12 w-12 text-muted-foreground/50" />
          <h2 className="text-lg font-semibold">{t('categories.empty')}</h2>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <table className={cn('w-full text-sm', textAlign)}>
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 font-medium">{t('tables.icon')}</th>
                <th className="px-4 py-3 font-medium">{t('tables.nameAr')}</th>
                <th className="px-4 py-3 font-medium">{t('tables.nameEn')}</th>
                <th className="px-4 py-3 font-medium">{t('tables.slug')}</th>
                <th className="px-4 py-3 font-medium">{t('common.active')}</th>
                <th className="px-4 py-3 text-end font-medium">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c: any) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 text-lg">{c.icon ?? '📁'}</td>
                  <td className="px-4 py-3 font-medium" dir="auto">{c.name_ar}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.name_en}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.slug}</td>
                  <td className="px-4 py-3">
                    {c.is_active ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-600" />}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm(t('categories.deleteConfirm'))) deleteCategory.mutate(c.id); }}>
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

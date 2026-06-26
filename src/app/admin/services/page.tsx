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

export default function AdminServicesPage() {
  const { data: services, isLoading } = useAdminServices();
  const { data: categories } = useCategories();
  const createService = useAdminCreateService();
  const updateService = useAdminUpdateService();
  const deleteService = useAdminDeleteService();

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

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Services</h1>
          <p className="mt-1 text-muted-foreground">Manage service offerings.</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} disabled={showForm}>
          <Plus className="mr-1 h-4 w-4" /> Add Service
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">{editingId ? 'Edit Service' : 'New Service'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name_ar">Name (Arabic)</Label>
                  <Input id="name_ar" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_en">Name (English)</Label>
                  <Input id="name_en" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea id="desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cat">Category</Label>
                  <select id="cat" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                    <option value="">Select...</option>
                    {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name_ar} / {c.name_en}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input id="price" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ptype">Price Type</Label>
                  <select id="ptype" value={form.price_type} onChange={(e) => setForm({ ...form, price_type: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                    <option value="fixed">Fixed</option>
                    <option value="hourly">Hourly</option>
                    <option value="estimate">Estimate</option>
                  </select>
                </div>
              </div>
              <Button type="submit" disabled={createService.isPending || updateService.isPending}>
                {editingId ? 'Update' : 'Create'} Service
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
          <h2 className="text-lg font-semibold">No services</h2>
          <p className="text-sm text-muted-foreground">Create your first service to get started.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Name (AR)</th>
                <th className="px-4 py-3 text-left font-medium">Name (EN)</th>
                <th className="px-4 py-3 text-left font-medium">Category</th>
                <th className="px-4 py-3 text-left font-medium">Price</th>
                <th className="px-4 py-3 text-left font-medium">Active</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s: any) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium" dir="auto">{s.name_ar}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.name_en}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.service_categories?.name_en ?? '—'}</td>
                  <td className="px-4 py-3">
                    {s.price ? `SAR ${s.price}` : '—'}
                    <span className="ml-1 text-xs text-muted-foreground">/{s.price_type}</span>
                  </td>
                  <td className="px-4 py-3">
                    {s.is_active ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-600" />}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(s)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete this service?')) deleteService.mutate(s.id); }}>
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

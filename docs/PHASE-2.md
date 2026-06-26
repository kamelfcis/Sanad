# Phase 2 — Core Database & Services

## Goal
Complete database schema for categories and services. Seed initial data. Display services in a customer-facing UI.

---

## Database Changes

### Table: `service_categories`
```sql
CREATE TABLE service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `services`
```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE RESTRICT,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2),
  price_type TEXT NOT NULL DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'hourly', 'estimate')),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### RLS Policies
- `service_categories`: PUBLIC SELECT (active only)
- `services`: PUBLIC SELECT (active only, joined with active category)
- Admin: INSERT, UPDATE, DELETE

---

## Seed Data

### Categories
| Arabic | English | Slug |
|--------|---------|------|
| سباكة | Plumbing | plumbing |
| كهرباء | Electrical | electrical |
| تكييف | AC Repair | ac-repair |
| نجارة | Carpentry | carpentry |
| دهان | Painting | painting |
| تنظيف | Cleaning | cleaning |
| حدادة | Metalwork | metalwork |
| زجاج | Glass Work | glass-work |
| جبس | Drywall | drywall |
| سيراميك | Tiling | tiling |
| صيانة عامة | General Maintenance | general-maintenance |

### Services (3-5 per category)
Example for Plumbing:
- إصلاح تسريبات (Leak Repair) — fixed
- تركيب سباكة (Pipe Installation) — hourly
- صيانة عامة (General Maintenance) — hourly

---

## UI Components

- `CategoryCard` — grid card with icon + name
- `ServiceCard` — service item with name + price
- `ServicesGrid` — grid layout with categories filter
- `CategoryFilter` — horizontal scrollable filter chips

---

## Pages

| Route | Purpose |
|-------|---------|
| `/customer/services` | Browse all categories + services |
| `/customer/services/[slug]` | Services in a category |

---

## Checklist

- [ ] Migration files created and runnable
- [ ] Categories table has data
- [ ] Services table has data
- [ ] RLS allows public read for active records
- [ ] `/customer/services` renders categories
- [ ] Clicking category shows services
- [ ] Responsive grid layout

## Done Definition
- [ ] `SELECT * FROM service_categories WHERE is_active = true` returns rows
- [ ] `SELECT * FROM services WHERE is_active = true` returns rows
- [ ] UI shows categories in a grid
- [ ] Clicking category navigates to filtered service list

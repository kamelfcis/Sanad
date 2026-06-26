-- Create services table
CREATE TABLE IF NOT EXISTS services (
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

-- Enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view active services"
  ON services FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin can manage services"
  ON services FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Seed services per category
-- Plumbing (id from slug)
DO $$
DECLARE
  plumbing_id UUID;
  electrical_id UUID;
  ac_repair_id UUID;
  carpentry_id UUID;
  painting_id UUID;
  cleaning_id UUID;
  metalwork_id UUID;
  glass_work_id UUID;
  drywall_id UUID;
  tiling_id UUID;
  general_id UUID;
BEGIN
  SELECT id INTO plumbing_id FROM service_categories WHERE slug = 'plumbing';
  SELECT id INTO electrical_id FROM service_categories WHERE slug = 'electrical';
  SELECT id INTO ac_repair_id FROM service_categories WHERE slug = 'ac-repair';
  SELECT id INTO carpentry_id FROM service_categories WHERE slug = 'carpentry';
  SELECT id INTO painting_id FROM service_categories WHERE slug = 'painting';
  SELECT id INTO cleaning_id FROM service_categories WHERE slug = 'cleaning';
  SELECT id INTO metalwork_id FROM service_categories WHERE slug = 'metalwork';
  SELECT id INTO glass_work_id FROM service_categories WHERE slug = 'glass-work';
  SELECT id INTO drywall_id FROM service_categories WHERE slug = 'drywall';
  SELECT id INTO tiling_id FROM service_categories WHERE slug = 'tiling';
  SELECT id INTO general_id FROM service_categories WHERE slug = 'general-maintenance';

  -- Plumbing services
  INSERT INTO services (category_id, name_ar, name_en, slug, description, price, price_type, sort_order) VALUES
    (plumbing_id, 'إصلاح تسريبات', 'Leak Repair', 'leak-repair', 'Fix water leaks in pipes, faucets, and fixtures.', 150.00, 'fixed', 1),
    (plumbing_id, 'تركيب سباكة', 'Pipe Installation', 'pipe-installation', 'Install new pipes and plumbing fixtures.', 200.00, 'hourly', 2),
    (plumbing_id, 'صيانة عامة', 'General Plumbing', 'general-plumbing', 'Comprehensive plumbing maintenance and inspection.', 180.00, 'hourly', 3),
    (plumbing_id, 'تسليك مجاري', 'Drain Cleaning', 'drain-cleaning', 'Unclog and clean drains and sewage lines.', 120.00, 'fixed', 4),
    (plumbing_id, 'تركيب سخان', 'Water Heater Installation', 'water-heater-install', 'Install and repair water heaters.', 350.00, 'fixed', 5);

  -- Electrical services
  INSERT INTO services (category_id, name_ar, name_en, slug, description, price, price_type, sort_order) VALUES
    (electrical_id, 'إصلاح أعطال', 'Electrical Repairs', 'electrical-repairs', 'Fix electrical faults and wiring issues.', 150.00, 'hourly', 1),
    (electrical_id, 'تركيب إضاءة', 'Lighting Installation', 'lighting-installation', 'Install light fixtures, switches, and dimmers.', 100.00, 'fixed', 2),
    (electrical_id, 'تمديد أسلاك', 'Wiring Installation', 'wiring-installation', 'New wiring for rooms, appliances, and renovations.', 200.00, 'hourly', 3),
    (electrical_id, 'صيانة لوحة كهرباء', 'Panel Maintenance', 'panel-maintenance', 'Electrical panel inspection and maintenance.', 250.00, 'fixed', 4),
    (electrical_id, 'تركيب مروحة', 'Fan Installation', 'fan-installation', 'Install ceiling fans and exhaust fans.', 120.00, 'fixed', 5);

  -- AC Repair services
  INSERT INTO services (category_id, name_ar, name_en, slug, description, price, price_type, sort_order) VALUES
    (ac_repair_id, 'إصلاح تكييف', 'AC Repair', 'ac-repair-service', 'Diagnose and repair air conditioning issues.', 200.00, 'fixed', 1),
    (ac_repair_id, 'تركيب تكييف', 'AC Installation', 'ac-installation', 'Install new air conditioning units.', 400.00, 'fixed', 2),
    (ac_repair_id, 'تنظيف تكييف', 'AC Cleaning', 'ac-cleaning', 'Deep clean AC filters, coils, and units.', 150.00, 'fixed', 3),
    (ac_repair_id, 'صيانة دورية', 'AC Maintenance', 'ac-maintenance', 'Regular maintenance and performance check.', 180.00, 'fixed', 4),
    (ac_repair_id, 'تعبئة فريون', 'Gas Refill', 'gas-refill', 'Refill refrigerant gas for AC units.', 250.00, 'fixed', 5);

  -- Carpentry services
  INSERT INTO services (category_id, name_ar, name_en, slug, description, price, price_type, sort_order) VALUES
    (carpentry_id, 'تركيب مطابخ', 'Kitchen Installation', 'kitchen-installation', 'Install custom kitchen cabinets and countertops.', 300.00, 'hourly', 1),
    (carpentry_id, 'إصلاح أثاث', 'Furniture Repair', 'furniture-repair', 'Repair damaged furniture and wooden items.', 150.00, 'hourly', 2),
    (carpentry_id, 'تركيب أبواب', 'Door Installation', 'door-installation', 'Install interior and exterior doors.', 200.00, 'fixed', 3),
    (carpentry_id, 'نجارة حسب الطلب', 'Custom Woodwork', 'custom-woodwork', 'Custom-made wooden furniture and fixtures.', 250.00, 'estimate', 4);

  -- Painting services
  INSERT INTO services (category_id, name_ar, name_en, slug, description, price, price_type, sort_order) VALUES
    (painting_id, 'دهان داخلي', 'Interior Painting', 'interior-painting', 'Paint interior walls and ceilings.', 200.00, 'hourly', 1),
    (painting_id, 'دهان خارجي', 'Exterior Painting', 'exterior-painting', 'Paint exterior walls and facades.', 250.00, 'hourly', 2),
    (painting_id, 'دهان غرفة', 'Room Painting', 'room-painting', 'Professional painting for a single room.', 150.00, 'fixed', 3),
    (painting_id, 'دهان خشب', 'Wood Painting', 'wood-painting', 'Paint and varnish wooden surfaces.', 120.00, 'hourly', 4);

  -- Cleaning services
  INSERT INTO services (category_id, name_ar, name_en, slug, description, price, price_type, sort_order) VALUES
    (cleaning_id, 'تنظيف شامل', 'Deep Cleaning', 'deep-cleaning', 'Comprehensive deep cleaning for your entire home.', 300.00, 'fixed', 1),
    (cleaning_id, 'تنظيف عادي', 'Regular Cleaning', 'regular-cleaning', 'Standard cleaning service for homes and apartments.', 150.00, 'fixed', 2),
    (cleaning_id, 'تنظيف بعد البناء', 'Post-Construction Cleaning', 'post-construction-cleaning', 'Heavy cleaning after construction or renovation.', 350.00, 'fixed', 3),
    (cleaning_id, 'تنظيف سجاد', 'Carpet Cleaning', 'carpet-cleaning', 'Professional steam cleaning for carpets and rugs.', 200.00, 'fixed', 4);

  -- Metalwork services
  INSERT INTO services (category_id, name_ar, name_en, slug, description, price, price_type, sort_order) VALUES
    (metalwork_id, 'تركيب بوابات', 'Gate Installation', 'gate-installation', 'Install metal gates and security doors.', 500.00, 'estimate', 1),
    (metalwork_id, 'لحام', 'Welding Services', 'welding-services', 'Metal welding and fabrication for repairs.', 200.00, 'hourly', 2),
    (metalwork_id, 'درابزين', 'Railing Installation', 'railing-installation', 'Install metal railings and handrails.', 300.00, 'estimate', 3),
    (metalwork_id, 'هيكل معدني', 'Metal Structure', 'metal-structure', 'Build custom metal structures and frames.', 400.00, 'estimate', 4);

  -- Glass Work services
  INSERT INTO services (category_id, name_ar, name_en, slug, description, price, price_type, sort_order) VALUES
    (glass_work_id, 'تركيب زجاج', 'Glass Installation', 'glass-installation', 'Install glass for windows and doors.', 250.00, 'fixed', 1),
    (glass_work_id, 'إصلاح زجاج', 'Glass Repair', 'glass-repair', 'Repair cracked or broken glass.', 150.00, 'fixed', 2),
    (glass_work_id, 'زجاج دبل', 'Double Glazing', 'double-glazing', 'Install double-glazed windows for insulation.', 400.00, 'fixed', 3),
    (glass_work_id, 'مرايا', 'Mirror Installation', 'mirror-installation', 'Custom mirror cutting and installation.', 100.00, 'fixed', 4);

  -- Drywall services
  INSERT INTO services (category_id, name_ar, name_en, slug, description, price, price_type, sort_order) VALUES
    (drywall_id, 'تركيب جبس', 'Drywall Installation', 'drywall-installation', 'Install drywall partitions and ceilings.', 200.00, 'hourly', 1),
    (drywall_id, 'أسقف جبس', 'Gypsum Ceilings', 'gypsum-ceilings', 'Decorative gypsum ceiling designs.', 300.00, 'estimate', 2),
    (drywall_id, 'إصلاح جبس', 'Drywall Repair', 'drywall-repair', 'Fix holes and damage in drywall.', 100.00, 'fixed', 3),
    (drywall_id, 'قواطع جبس', 'Drywall Partitions', 'drywall-partitions', 'Build room dividers and partition walls.', 250.00, 'hourly', 4);

  -- Tiling services
  INSERT INTO services (category_id, name_ar, name_en, slug, description, price, price_type, sort_order) VALUES
    (tiling_id, 'تركيب سيراميك', 'Tile Installation', 'tile-installation', 'Install ceramic and porcelain tiles.', 200.00, 'hourly', 1),
    (tiling_id, 'تركيب رخام', 'Marble Installation', 'marble-installation', 'Install marble tiles and slabs.', 350.00, 'hourly', 2),
    (tiling_id, 'إصلاح بلاط', 'Tile Repair', 'tile-repair', 'Replace broken or damaged tiles.', 100.00, 'fixed', 3),
    (tiling_id, 'عزل حمامات', 'Bathroom Waterproofing', 'bathroom-waterproofing', 'Waterproofing and tiling for bathrooms.', 400.00, 'estimate', 4);

  -- General Maintenance services
  INSERT INTO services (category_id, name_ar, name_en, slug, description, price, price_type, sort_order) VALUES
    (general_id, 'صيانة منزل', 'Home Maintenance', 'home-maintenance', 'General home maintenance and minor repairs.', 150.00, 'hourly', 1),
    (general_id, 'تركيب ستائر', 'Curtain Installation', 'curtain-installation', 'Install curtain rods and blinds.', 80.00, 'fixed', 2),
    (general_id, 'تجميع أثاث', 'Furniture Assembly', 'furniture-assembly', 'Assemble flat-pack furniture.', 120.00, 'fixed', 3),
    (general_id, 'فحص المنزل', 'Home Inspection', 'home-inspection', 'Thorough home inspection and condition report.', 200.00, 'fixed', 4),
    (general_id, 'نقل أثاث', 'Furniture Moving', 'furniture-moving', 'Help with moving furniture within the home.', 100.00, 'hourly', 5);
END $$;

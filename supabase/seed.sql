-- Sanad seed data for local/dev environments
-- Run: supabase db reset (applies migrations + seed)
-- Categories requested: كهرباء, سباكة, تكييف, نجارة, دهانات, أجهزة منزلية

INSERT INTO service_categories (name_ar, name_en, slug, description, icon, sort_order, is_active) VALUES
  ('كهرباء', 'Electrical', 'electrical', 'خدمات كهربائية مرخصة للتمديدات والإصلاحات.', 'zap', 1, true),
  ('سباكة', 'Plumbing', 'plumbing', 'خدمات سباكة احترافية للإصلاح والتركيب والصيانة.', 'droplet', 2, true),
  ('تكييف', 'AC Repair', 'ac-repair', 'تركيب وصيانة وإصلاح أجهزة التكييف.', 'snowflake', 3, true),
  ('نجارة', 'Carpentry', 'carpentry', 'أعمال نجارة وأثاث حسب الطلب.', 'hammer', 4, true),
  ('دهانات', 'Painting', 'painting', 'دهان داخلي وخارجي للمنازل والمكاتب.', 'paintbrush', 5, true),
  ('أجهزة منزلية', 'Home Appliances', 'home-appliances', 'صيانة وتركيب الأجهزة المنزلية.', 'refrigerator', 6, true)
ON CONFLICT (slug) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

DO $$
DECLARE
  electrical_id UUID;
  plumbing_id UUID;
  ac_id UUID;
  carpentry_id UUID;
  painting_id UUID;
  appliances_id UUID;
BEGIN
  SELECT id INTO electrical_id FROM service_categories WHERE slug = 'electrical';
  SELECT id INTO plumbing_id FROM service_categories WHERE slug = 'plumbing';
  SELECT id INTO ac_id FROM service_categories WHERE slug = 'ac-repair';
  SELECT id INTO carpentry_id FROM service_categories WHERE slug = 'carpentry';
  SELECT id INTO painting_id FROM service_categories WHERE slug = 'painting';
  SELECT id INTO appliances_id FROM service_categories WHERE slug = 'home-appliances';

  INSERT INTO services (category_id, name_ar, name_en, slug, description, price, price_type, sort_order, is_active) VALUES
    (electrical_id, 'إصلاح قصر كهربائي', 'Short Circuit Repair', 'short-circuit-repair', 'تشخيص وإصلاح أعطال القصر الكهربائي.', 180.00, 'fixed', 1, true),
    (electrical_id, 'تركيب ثريات وإنارة', 'Lighting Installation', 'lighting-installation', 'تركيب وحدات الإضاءة والثريات.', 120.00, 'fixed', 2, true),
    (electrical_id, 'تمديد أسلاك', 'Wiring Installation', 'wiring-installation', 'تمديد أسلاك كهربائية للغرف والأجهزة.', 200.00, 'hourly', 3, true),
    (plumbing_id, 'إصلاح تسريبات', 'Leak Repair', 'leak-repair', 'إصلاح تسريبات الأنابيب والحنفيات.', 150.00, 'fixed', 1, true),
    (plumbing_id, 'تسليك مجاري', 'Drain Unclogging', 'drain-unclogging', 'تسليك المجاري والبالوعات.', 120.00, 'fixed', 2, true),
    (plumbing_id, 'تركيب سخان ماء', 'Water Heater Install', 'water-heater-install', 'تركيب وصيانة سخانات المياه.', 350.00, 'fixed', 3, true),
    (ac_id, 'صيانة تكييف', 'AC Maintenance', 'ac-maintenance', 'تنظيف وفحص دوري لوحدات التكييف.', 180.00, 'fixed', 1, true),
    (ac_id, 'إصلاح تكييف', 'AC Repair', 'ac-repair-service', 'تشخيص وإصلاح أعطال التكييف.', 220.00, 'fixed', 2, true),
    (ac_id, 'تركيب مكيف', 'AC Installation', 'ac-installation', 'تركيب مكيفات سبليت وشباك.', 400.00, 'fixed', 3, true),
    (carpentry_id, 'تركيب مطابخ', 'Kitchen Installation', 'kitchen-installation', 'تركيب مطابخ خشبية ومودular.', 300.00, 'hourly', 1, true),
    (carpentry_id, 'إصلاح أبواب', 'Door Repair', 'door-repair', 'إصلاح وضبط الأبواب الخشبية.', 150.00, 'fixed', 2, true),
    (carpentry_id, 'نجارة حسب الطلب', 'Custom Carpentry', 'custom-carpentry', 'تصنيع قطع خشبية مخصصة.', 250.00, 'estimate', 3, true),
    (painting_id, 'دهان غرفة', 'Room Painting', 'room-painting', 'دهان غرفة واحدة شامل التجهيز.', 200.00, 'fixed', 1, true),
    (painting_id, 'دهان خارجي', 'Exterior Painting', 'exterior-painting', 'دهان واجهات خارجية.', 280.00, 'hourly', 2, true),
    (painting_id, 'معالجة رطوبة قبل الدهان', 'Moisture Treatment', 'moisture-treatment', 'معالجة الرطوبة والتشققات قبل الدهان.', 350.00, 'estimate', 3, true),
    (appliances_id, 'صيانة غسالة', 'Washing Machine Repair', 'washing-machine-repair', 'إصلاح أعطال الغسالات الأوتوماتيك.', 180.00, 'fixed', 1, true),
    (appliances_id, 'صيانة ثلاجة', 'Refrigerator Repair', 'refrigerator-repair', 'إصلاح مشاكل التبريد والتسريب.', 200.00, 'fixed', 2, true),
    (appliances_id, 'تركيب فرن وموقد', 'Oven Installation', 'oven-installation', 'تركيب وتوصيل الأفران والمواقد.', 150.00, 'fixed', 3, true)
  ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name_ar = EXCLUDED.name_ar,
    name_en = EXCLUDED.name_en,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    price_type = EXCLUDED.price_type,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active;
END $$;

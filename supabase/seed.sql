-- ============================================================================
-- Milano Home Services — seed data (Milestone 1)
-- Placeholder catalog + the Milano zone. All of this is admin-editable later;
-- nothing here should be duplicated as constants in the app.
-- Idempotent: safe to re-run (guarded by NOT EXISTS on English name).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Zone: Milano
-- ---------------------------------------------------------------------------
insert into public.zones (name, city, active)
select 'Milano', 'Milano', true
where not exists (
  select 1 from public.zones where name = 'Milano' and city = 'Milano'
);

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
insert into public.service_categories (name, icon, sort_order, active)
select v.name, v.icon, v.sort_order, true
from (values
  ('{"it":"Idraulica","en":"Plumbing","ar":"السباكة"}'::jsonb,        'pipe',      1),
  ('{"it":"Pulizie","en":"Cleaning","ar":"التنظيف"}'::jsonb,          'sparkles',  2),
  ('{"it":"Falegnameria","en":"Carpentry","ar":"النجارة"}'::jsonb,    'hammer',    3),
  ('{"it":"Elettricità","en":"Electrical","ar":"الكهرباء"}'::jsonb,   'bolt',      4),
  ('{"it":"Condizionamento","en":"AC","ar":"التكييف"}'::jsonb,        'snowflake', 5)
) as v(name, icon, sort_order)
where not exists (
  select 1 from public.service_categories sc
  where sc.name->>'en' = v.name->>'en'
);

-- ---------------------------------------------------------------------------
-- Services (2–3 per category). Category resolved by its English name.
-- ---------------------------------------------------------------------------
insert into public.services
  (category_id, name, description, base_price, price_unit, sort_order, active)
select c.id, v.name, v.description, v.base_price, v.price_unit, v.sort_order, true
from (values
  -- Plumbing
  ('Plumbing',
   '{"it":"Riparazione perdite","en":"Leak repair","ar":"إصلاح التسرب"}'::jsonb,
   '{"it":"Individuazione e riparazione di perdite d''acqua.","en":"Locate and repair water leaks.","ar":"تحديد وإصلاح تسربات المياه."}'::jsonb,
   60::numeric, 'fixed', 1),
  ('Plumbing',
   '{"it":"Sostituzione rubinetto","en":"Faucet replacement","ar":"استبدال الصنبور"}'::jsonb,
   '{"it":"Sostituzione di rubinetti e miscelatori.","en":"Replace taps and mixers.","ar":"استبدال الصنابير والخلاطات."}'::jsonb,
   45::numeric, 'fixed', 2),
  ('Plumbing',
   '{"it":"Sturatura scarichi","en":"Drain unclogging","ar":"تسليك المجاري"}'::jsonb,
   '{"it":"Pulizia e sturatura di scarichi otturati.","en":"Clear blocked drains.","ar":"تنظيف وتسليك المصارف المسدودة."}'::jsonb,
   55::numeric, 'fixed', 3),

  -- Cleaning
  ('Cleaning',
   '{"it":"Pulizia appartamento","en":"Apartment cleaning","ar":"تنظيف الشقة"}'::jsonb,
   '{"it":"Pulizia completa dell''appartamento.","en":"Full apartment cleaning.","ar":"تنظيف شامل للشقة."}'::jsonb,
   25::numeric, 'hourly', 1),
  ('Cleaning',
   '{"it":"Pulizia profonda","en":"Deep cleaning","ar":"تنظيف عميق"}'::jsonb,
   '{"it":"Pulizia approfondita di superfici ed elettrodomestici.","en":"Deep clean of surfaces and appliances.","ar":"تنظيف عميق للأسطح والأجهزة."}'::jsonb,
   35::numeric, 'hourly', 2),
  ('Cleaning',
   '{"it":"Pulizia vetri","en":"Window cleaning","ar":"تنظيف النوافذ"}'::jsonb,
   '{"it":"Pulizia di vetri e infissi.","en":"Clean windows and frames.","ar":"تنظيف النوافذ والإطارات."}'::jsonb,
   20::numeric, 'hourly', 3),

  -- Carpentry
  ('Carpentry',
   '{"it":"Montaggio mobili","en":"Furniture assembly","ar":"تركيب الأثاث"}'::jsonb,
   '{"it":"Montaggio di mobili e arredi.","en":"Assemble flat-pack furniture.","ar":"تركيب الأثاث الجاهز."}'::jsonb,
   40::numeric, 'fixed', 1),
  ('Carpentry',
   '{"it":"Riparazione porte","en":"Door repair","ar":"إصلاح الأبواب"}'::jsonb,
   '{"it":"Riparazione e regolazione di porte.","en":"Repair and adjust doors.","ar":"إصلاح وضبط الأبواب."}'::jsonb,
   50::numeric, 'fixed', 2),

  -- Electrical
  ('Electrical',
   '{"it":"Sostituzione presa","en":"Outlet replacement","ar":"استبدال المقبس"}'::jsonb,
   '{"it":"Sostituzione di prese e interruttori.","en":"Replace outlets and switches.","ar":"استبدال المقابس والمفاتيح."}'::jsonb,
   35::numeric, 'fixed', 1),
  ('Electrical',
   '{"it":"Installazione lampadario","en":"Light fixture install","ar":"تركيب الإضاءة"}'::jsonb,
   '{"it":"Installazione di lampadari e punti luce.","en":"Install ceiling lights and fixtures.","ar":"تركيب الثريات ووحدات الإضاءة."}'::jsonb,
   45::numeric, 'fixed', 2),
  ('Electrical',
   '{"it":"Verifica impianto","en":"Wiring inspection","ar":"فحص الأسلاك"}'::jsonb,
   '{"it":"Controllo e diagnosi dell''impianto elettrico.","en":"Inspect and diagnose wiring.","ar":"فحص وتشخيص الأسلاك."}'::jsonb,
   60::numeric, 'fixed', 3),

  -- AC
  ('AC',
   '{"it":"Manutenzione climatizzatore","en":"AC maintenance","ar":"صيانة المكيف"}'::jsonb,
   '{"it":"Pulizia e manutenzione del climatizzatore.","en":"Clean and service AC units.","ar":"تنظيف وصيانة المكيفات."}'::jsonb,
   70::numeric, 'fixed', 1),
  ('AC',
   '{"it":"Ricarica gas","en":"Refrigerant recharge","ar":"إعادة شحن الغاز"}'::jsonb,
   '{"it":"Ricarica del gas refrigerante.","en":"Recharge refrigerant gas.","ar":"إعادة شحن غاز التبريد."}'::jsonb,
   90::numeric, 'fixed', 2),
  ('AC',
   '{"it":"Installazione climatizzatore","en":"AC installation","ar":"تركيب المكيف"}'::jsonb,
   '{"it":"Installazione di nuovi climatizzatori.","en":"Install new AC units.","ar":"تركيب مكيفات جديدة."}'::jsonb,
   150::numeric, 'fixed', 3)
) as v(cat_en, name, description, base_price, price_unit, sort_order)
join public.service_categories c on c.name->>'en' = v.cat_en
where not exists (
  select 1 from public.services s
  where s.name->>'en' = v.name->>'en'
);

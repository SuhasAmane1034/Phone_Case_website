-- Initial GHYAMAJHA catalog seed.
-- Replace or extend through the admin product workflow; this seed establishes
-- only the launch catalogue represented in the new storefront.

insert into public.categories (name, slug) values
  ('Phone Cases', 'phone-cases'),
  ('Motorsport', 'motorsport'),
  ('MagSafe', 'magsafe'),
  ('Accessories', 'accessories'),
  ('Screen Protection', 'screen-protection')
on conflict (slug) do nothing;

insert into public.devices (name, slug, brand, series, position) values
  ('iPhone 17 Pro Max', 'iphone-17-pro-max', 'Apple', 'iPhone 17', 1),
  ('iPhone 17 Pro', 'iphone-17-pro', 'Apple', 'iPhone 17', 2),
  ('iPhone 17', 'iphone-17', 'Apple', 'iPhone 17', 3),
  ('iPhone 16 Pro Max', 'iphone-16-pro-max', 'Apple', 'iPhone 16', 4),
  ('iPhone 16', 'iphone-16', 'Apple', 'iPhone 16', 5),
  ('Samsung Galaxy S24 Ultra', 'samsung-s24-ultra', 'Samsung', 'Galaxy S', 6),
  ('Samsung Galaxy Z Fold 7', 'samsung-galaxy-z-fold-7', 'Samsung', 'Galaxy Z', 7),
  ('Samsung Galaxy Z Fold 6', 'samsung-galaxy-z-fold-6', 'Samsung', 'Galaxy Z', 8)
on conflict (slug) do nothing;

insert into public.products (
  name, slug, sku, short_description, description, regular_price_paise,
  sale_price_paise, category_id, tags, is_bestseller, is_featured,
  is_new_arrival, is_active, published_at
)
select
  seed.name, seed.slug, seed.sku, seed.short_description, seed.description,
  seed.regular_price_paise, seed.sale_price_paise,
  (select id from public.categories c where c.slug = seed.category_slug),
  seed.tags, seed.is_bestseller, seed.is_featured, seed.is_new_arrival,
  true, now()
from (values
  ('Monza Leather Case', 'monza-leather-case', 'MONZA', 'A motorsport-inspired leather case with precision protection.', 'Premium textured leather, tactile buttons and raised-edge protection.', 149900, 79900, 'phone-cases', array['leather','motorsport','magsafe']::text[], true, true, false),
  ('Scuderia Solid Series', 'scuderia-solid-series', 'SCUD', 'Clean solid protection with a race-bred finish.', 'A slim protective case with reinforced corners and tactile controls.', 119900, 59900, 'motorsport', array['motorsport','solid','iphone']::text[], true, false, false),
  ('Apex Motorsport Edition', 'apex-motorsport-edition', 'APEX', 'Bold stripes and engineered protection.', 'An expressive motorsport case with an impact-resistant frame.', 129900, 69900, 'motorsport', array['motorsport','new','iphone']::text[], false, true, true),
  ('Crystal Armor MagSafe', 'crystal-armor-magsafe', 'CRYSTAL', 'Clear reinforced protection with magnetic alignment.', 'A crystal-clear shell with raised camera protection and concealed magnetic ring.', 99900, 49900, 'magsafe', array['magsafe','clear','screen protection']::text[], false, true, false),
  ('FoldShield Kickstand Armor', 'foldshield-kickstand-armor', 'FOLD', 'Hinge protection and an integrated adjustable stand.', 'Full-protection case for Galaxy Z Fold devices.', 219900, 119900, 'phone-cases', array['fold','samsung','kickstand']::text[], false, true, false),
  ('Halo Magnetic Ring Cover', 'halo-magnetic-ring-cover', 'HALO', 'A magnetic ring cover with secure everyday grip.', 'A slim cover with a magnetic ring for compatible charging and hands-free use.', 129900, 64900, 'magsafe', array['magsafe','ring','accessory']::text[], false, false, false),
  ('HyperCharge Power Kit', 'hypercharge-power-kit', 'HYPER', 'Fast charging components for compatible devices.', 'An everyday charging kit with travel-ready cable management.', 99900, 49900, 'accessories', array['accessory','charging','power']::text[], false, false, false),
  ('OptiShield 9H Tempered Glass', 'optishield-9h-tempered-glass', 'OPTI', 'Scratch-resistant tempered glass protection.', 'High-clarity tempered glass with smudge-resistant finishing.', 69900, 29900, 'screen-protection', array['screen protection','glass','accessory']::text[], false, false, false)
) as seed(name, slug, sku, short_description, description, regular_price_paise, sale_price_paise, category_slug, tags, is_bestseller, is_featured, is_new_arrival)
where not exists (select 1 from public.products p where p.slug = seed.slug);

insert into public.product_variants (
  product_id, sku, name, colour, colour_hex, device_id,
  regular_price_paise, sale_price_paise, is_active
)
select p.id, v.sku, v.name, v.colour, v.colour_hex,
       d.id, v.regular_price_paise, v.sale_price_paise, true
from (
  values
    ('monza-leather-case','MONZA-17PM-BLK','iPhone 17 Pro Max — Black','Black','#171717','iphone-17-pro-max',149900,79900),
    ('monza-leather-case','MONZA-17P-BRN','iPhone 17 Pro — Brown','Brown','#70533a','iphone-17-pro',149900,79900),
    ('monza-leather-case','MONZA-S24-BLU','Samsung Galaxy S24 Ultra — Blue','Blue','#3b4d61','samsung-s24-ultra',149900,84900),
    ('scuderia-solid-series','SCUD-17-BLK','iPhone 17 — Black','Black','#171717','iphone-17',119900,59900),
    ('scuderia-solid-series','SCUD-16-RED','iPhone 16 — Red','Red','#b72e20','iphone-16',119900,59900),
    ('apex-motorsport-edition','APEX-17-BLU','iPhone 17 — Blue','Blue','#3b4d61','iphone-17',129900,69900),
    ('apex-motorsport-edition','APEX-16-BLK','iPhone 16 — Black','Black','#171717','iphone-16',129900,69900),
    ('crystal-armor-magsafe','CRYSTAL-17-CLR','iPhone 17 — Clear','Clear','#deded8','iphone-17',99900,49900),
    ('crystal-armor-magsafe','CRYSTAL-16-SLV','iPhone 16 — Silver','Silver','#bfc1bc','iphone-16',99900,49900),
    ('foldshield-kickstand-armor','FOLD-Z7-BLK','Galaxy Z Fold 7 — Black','Black','#171717','samsung-galaxy-z-fold-7',219900,119900)
) as v(product_slug,sku,name,colour,colour_hex,device_slug,regular_price_paise,sale_price_paise)
join public.products p on p.slug = v.product_slug
join public.devices d on d.slug = v.device_slug
where not exists (select 1 from public.product_variants pv where pv.sku = v.sku);

insert into public.inventory (variant_id, quantity, reserved_quantity, low_stock_threshold)
select pv.id,
       case pv.sku
         when 'MONZA-17PM-BLK' then 12
         when 'MONZA-17P-BRN' then 8
         when 'MONZA-S24-BLU' then 5
         when 'FOLD-Z7-BLK' then 6
         else 10
       end,
       0,
       5
from public.product_variants pv
where pv.sku in (
  'MONZA-17PM-BLK','MONZA-17P-BRN','MONZA-S24-BLU','SCUD-17-BLK','SCUD-16-RED',
  'APEX-17-BLU','APEX-16-BLK','CRYSTAL-17-CLR','CRYSTAL-16-SLV','FOLD-Z7-BLK'
)
on conflict (variant_id) do nothing;

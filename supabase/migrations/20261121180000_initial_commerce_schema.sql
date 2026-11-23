create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  role text not null check (role in ('admin', 'super_admin')),
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  parent_id uuid references public.categories(id),
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  brand text not null check (brand in ('Apple', 'Samsung', 'Other')),
  series text,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sku text unique,
  description text,
  short_description text,
  regular_price_paise integer not null check (regular_price_paise >= 0),
  sale_price_paise integer check (sale_price_paise is null or sale_price_paise >= 0),
  category_id uuid references public.categories(id),
  tags text[] not null default '{}',
  is_bestseller boolean not null default false,
  is_featured boolean not null default false,
  is_new_arrival boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint valid_sale_price check (sale_price_paise is null or sale_price_paise <= regular_price_paise)
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  position integer not null default 0,
  is_primary boolean not null default false
);

create table public.product_device_compatibility (
  product_id uuid not null references public.products(id) on delete cascade,
  device_id uuid not null references public.devices(id) on delete cascade,
  primary key (product_id, device_id)
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  name text not null,
  colour text,
  colour_hex text,
  device_id uuid references public.devices(id),
  regular_price_paise integer not null check (regular_price_paise >= 0),
  sale_price_paise integer check (sale_price_paise is null or sale_price_paise >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, device_id, colour),
  constraint valid_variant_sale_price check (sale_price_paise is null or sale_price_paise <= regular_price_paise)
);

create table public.inventory (
  variant_id uuid primary key references public.product_variants(id) on delete cascade,
  quantity integer not null default 0 check (quantity >= 0),
  reserved_quantity integer not null default 0 check (reserved_quantity >= 0),
  low_stock_threshold integer not null default 5,
  updated_at timestamptz not null default now(),
  constraint valid_reserved_quantity check (reserved_quantity <= quantity)
);

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles(id) on delete cascade,
  guest_token_hash text unique,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cart_owner_required check (user_id is not null or guest_token_hash is not null)
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id),
  quantity integer not null check (quantity > 0),
  unique (cart_id, variant_id)
);

create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  full_name text not null,
  phone text not null,
  email text,
  house text not null,
  street text not null,
  landmark text,
  city text not null,
  state text not null,
  pin_code text not null,
  is_default_shipping boolean not null default false,
  is_default_billing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value integer not null check (discount_value > 0),
  minimum_order_paise integer not null default 0,
  usage_limit integer,
  per_user_limit integer,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references public.profiles(id),
  customer_email text,
  customer_phone text not null,
  status text not null check (status in ('pending','confirmed','processing','packed','shipped','out_for_delivery','delivered','cancelled','returned')),
  payment_status text not null check (payment_status in ('pending','authorized','captured','failed','refunded','partially_refunded')),
  payment_method text not null check (payment_method in ('razorpay','cod')),
  subtotal_paise integer not null,
  discount_paise integer not null default 0,
  shipping_paise integer not null default 0,
  total_paise integer not null,
  shipping_address jsonb not null,
  billing_address jsonb,
  coupon_id uuid references public.coupons(id),
  shiprocket_shipment_id text,
  tracking_number text,
  tracking_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,
  cancelled_at timestamptz,
  constraint valid_order_total check (total_paise = subtotal_paise - discount_paise + shipping_paise)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  variant_id uuid references public.product_variants(id),
  product_name_snapshot text not null,
  variant_name_snapshot text not null,
  sku_snapshot text not null,
  device_name_snapshot text,
  colour_snapshot text,
  quantity integer not null check (quantity > 0),
  unit_price_paise integer not null check (unit_price_paise >= 0),
  line_total_paise integer not null check (line_total_paise >= 0),
  unique (order_id, variant_id)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null default 'razorpay',
  provider_order_id text unique,
  provider_payment_id text unique,
  provider_signature text,
  amount_paise integer not null,
  currency text not null default 'INR',
  status text not null check (status in ('created','authorized','captured','failed','refunded','partially_refunded')),
  method text,
  failure_reason text,
  captured_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'razorpay',
  event_id text not null unique,
  event_type text not null,
  payload jsonb not null,
  signature_valid boolean not null,
  processed_at timestamptz,
  processing_error text,
  received_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_item_id uuid references public.order_items(id),
  rating integer not null check (rating between 1 and 5),
  title text,
  body text,
  status text not null check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_path text not null,
  href text,
  position integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shipping_settings (
  id uuid primary key default gen_random_uuid(),
  free_shipping_threshold_paise integer not null default 0,
  flat_shipping_paise integer not null default 0,
  cod_enabled boolean not null default false,
  cod_limit_paise integer,
  updated_at timestamptz not null default now()
);

create index products_active_category_idx on public.products(category_id, is_active);
create index products_bestseller_idx on public.products(is_bestseller, is_active);
create index products_featured_idx on public.products(is_featured, is_active);
create index products_new_arrival_idx on public.products(is_new_arrival, is_active);
create index product_variants_product_idx on public.product_variants(product_id, is_active);
create index product_variants_device_idx on public.product_variants(device_id, is_active);
create index orders_number_idx on public.orders(order_number);
create index orders_user_created_idx on public.orders(user_id, created_at desc);
create index payments_order_provider_idx on public.payments(provider_order_id);
create index payments_payment_provider_idx on public.payments(provider_payment_id);
create index webhook_event_idx on public.webhook_events(event_id, event_type);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', null),
    coalesce(new.phone, null)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admin_roles
    where user_id = auth.uid() and role in ('admin', 'super_admin')
  );
$$;

alter table public.profiles enable row level security;
alter table public.admin_roles enable row level security;
alter table public.categories enable row level security;
alter table public.devices enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_device_compatibility enable row level security;
alter table public.product_variants enable row level security;
alter table public.inventory enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.wishlists enable row level security;
alter table public.addresses enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.webhook_events enable row level security;
alter table public.reviews enable row level security;
alter table public.banners enable row level security;
alter table public.shipping_settings enable row level security;

create policy "public can read active categories" on public.categories for select using (is_active);
create policy "public can read active devices" on public.devices for select using (is_active);
create policy "public can read active products" on public.products for select using (is_active);
create policy "public can read product images" on public.product_images for select using (exists (select 1 from public.products p where p.id = product_id and p.is_active));
create policy "public can read compatibility" on public.product_device_compatibility for select using (true);
create policy "public can read active variants" on public.product_variants for select using (is_active);
create policy "public can read inventory" on public.inventory for select using (true);
create policy "public can read active banners" on public.banners for select using (is_active);
create policy "public can read approved reviews" on public.reviews for select using (status = 'approved');
create policy "public can read shipping settings" on public.shipping_settings for select using (true);

create policy "users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "users update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "users read own addresses" on public.addresses for select using (auth.uid() = user_id);
create policy "users manage own addresses" on public.addresses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users read own wishlist" on public.wishlists for select using (auth.uid() = user_id);
create policy "users manage own wishlist" on public.wishlists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users read own orders" on public.orders for select using (auth.uid() = user_id);
create policy "users read own order items" on public.order_items for select using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "users read own carts" on public.carts for select using (auth.uid() = user_id);
create policy "users manage own carts" on public.carts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users read own cart items" on public.cart_items for select using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));
create policy "users manage own cart items" on public.cart_items for all using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())) with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));

create policy "admins manage categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage devices" on public.devices for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage products" on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage images" on public.product_images for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage compatibility" on public.product_device_compatibility for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage variants" on public.product_variants for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage inventory" on public.inventory for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage orders" on public.orders for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage order items" on public.order_items for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage coupons" on public.coupons for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage reviews" on public.reviews for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage banners" on public.banners for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage shipping" on public.shipping_settings for all using (public.is_admin()) with check (public.is_admin());

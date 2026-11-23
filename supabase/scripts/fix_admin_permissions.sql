-- ==============================================================================
-- GHYAMAJHA Complete Table Permissions & Admin Access Fix
-- ==============================================================================
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- It grants table privileges to the authenticated role and updates RLS policies.
-- ==============================================================================

-- 1. Ensure columns expected by the admin panel exist:
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS reservation_expires_at timestamptz;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS avatar_url text;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS primary_image text;

-- 2. Grant table-level permissions to authenticated role:
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- 3. Orders Policies (Admins can view and manage all orders; customers can place orders)
DROP POLICY IF EXISTS "admins manage orders" ON public.orders;
DROP POLICY IF EXISTS "admins read all orders" ON public.orders;
DROP POLICY IF EXISTS "role permissions read orders" ON public.orders;
DROP POLICY IF EXISTS "role permissions update orders" ON public.orders;
DROP POLICY IF EXISTS "public insert orders" ON public.orders;
DROP POLICY IF EXISTS "public update orders" ON public.orders;

CREATE POLICY "public insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "public update orders"
  ON public.orders FOR UPDATE
  USING (true);

CREATE POLICY "admins read all orders"
  ON public.orders FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
    OR auth.uid() = user_id
  );

CREATE POLICY "admins manage all orders"
  ON public.orders FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
  );

-- 4. Order Items Policies
DROP POLICY IF EXISTS "admins manage order items" ON public.order_items;
DROP POLICY IF EXISTS "admins read all order_items" ON public.order_items;
DROP POLICY IF EXISTS "role permissions read order items" ON public.order_items;
DROP POLICY IF EXISTS "public insert order_items" ON public.order_items;

CREATE POLICY "public insert order_items"
  ON public.order_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "admins manage all order items"
  ON public.order_items FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );

-- 5. Profiles Policies (Admins can view customer list; users view their own)
DROP POLICY IF EXISTS "admins read profiles" ON public.profiles;
CREATE POLICY "admins read profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
    OR auth.uid() = id
  );

-- 6. Products, Images, Categories & Inventory Policies
DROP POLICY IF EXISTS "public read active products" ON public.products;
CREATE POLICY "public read active products"
  ON public.products FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "admins manage products" ON public.products;
CREATE POLICY "admins manage products"
  ON public.products FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "public read product images" ON public.product_images;
CREATE POLICY "public read product images"
  ON public.product_images FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "admins manage product images" ON public.product_images;
CREATE POLICY "admins manage product images"
  ON public.product_images FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "public read categories" ON public.categories;
CREATE POLICY "public read categories"
  ON public.categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "admins manage inventory" ON public.inventory;
CREATE POLICY "admins manage inventory"
  ON public.inventory FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
    OR true
  );

-- 7. Payments Policies
DROP POLICY IF EXISTS "admins manage payments" ON public.payments;
DROP POLICY IF EXISTS "public insert payments" ON public.payments;
DROP POLICY IF EXISTS "public update payments" ON public.payments;

CREATE POLICY "public insert payments"
  ON public.payments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "public update payments"
  ON public.payments FOR UPDATE
  USING (true);

CREATE POLICY "admins manage payments"
  ON public.payments FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
  );

-- 8. Verification: check that you can read orders count
SELECT count(*) AS total_orders FROM public.orders;

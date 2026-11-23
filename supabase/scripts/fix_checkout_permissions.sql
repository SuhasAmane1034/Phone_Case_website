-- ==============================================================================
-- GHYAMAJHA Fix Checkout Permissions (Orders, Order Items & Payments)
-- ==============================================================================
-- Run this in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Run (Cmd+Enter / Ctrl+Enter)
-- ==============================================================================

-- 1. Ensure required columns exist
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS reservation_expires_at timestamptz;

-- 2. Grant table permissions to all roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.orders TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.order_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.payments TO anon, authenticated, service_role;

-- 3. Orders RLS Policies: Allow anyone (guests & users) to place and view an order
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public insert orders" ON public.orders;
CREATE POLICY "public insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "public update orders" ON public.orders;
CREATE POLICY "public update orders"
  ON public.orders FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "admins read all orders" ON public.orders;
DROP POLICY IF EXISTS "public read orders" ON public.orders;
CREATE POLICY "public read orders"
  ON public.orders FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "admins manage all orders" ON public.orders;
CREATE POLICY "admins manage all orders"
  ON public.orders FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
  );

-- 4. Order Items RLS Policies: Allow line items to be inserted and read
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public insert order_items" ON public.order_items;
CREATE POLICY "public insert order_items"
  ON public.order_items FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "public read order_items" ON public.order_items;
CREATE POLICY "public read order_items"
  ON public.order_items FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "admins manage all order items" ON public.order_items;
CREATE POLICY "admins manage all order items"
  ON public.order_items FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
    OR true
  );

-- 5. Payments RLS Policies: Allow payment records to be created, updated and read
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public insert payments" ON public.payments;
CREATE POLICY "public insert payments"
  ON public.payments FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "public update payments" ON public.payments;
CREATE POLICY "public update payments"
  ON public.payments FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "public read payments" ON public.payments;
CREATE POLICY "public read payments"
  ON public.payments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "admins manage payments" ON public.payments;
CREATE POLICY "admins manage payments"
  ON public.payments FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
  );

-- 6. Verification: Check that order count is readable
SELECT count(*) AS total_orders FROM public.orders;

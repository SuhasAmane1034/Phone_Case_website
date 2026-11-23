-- ==============================================================================
-- GHYAMAJHA COMPLETE DATABASE SETUP, ADMIN ROLES & PERMISSIONS SCRIPT
-- ==============================================================================
-- Run this in your Supabase SQL Editor:
-- Dashboard (https://supabase.com/dashboard) > Select Project > SQL Editor > New Query > Paste & Run
-- ==============================================================================

-- 1. Ensure schema columns expected by the application exist
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS reservation_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS tracking_url text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS avatar_url text;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS primary_image text;

-- 2. Grant schema and table usage permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- 3. Configure public.admin_roles table RLS
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "authenticated insert admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "authenticated update admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "users read own admin role" ON public.admin_roles;
DROP POLICY IF EXISTS "admin_roles_select_policy" ON public.admin_roles;
DROP POLICY IF EXISTS "admin_roles_manage_policy" ON public.admin_roles;
DROP POLICY IF EXISTS "authenticated claim admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "authenticated manage admin roles" ON public.admin_roles;

CREATE POLICY "authenticated read admin roles"
  ON public.admin_roles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "authenticated insert admin roles"
  ON public.admin_roles FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated update admin roles"
  ON public.admin_roles FOR UPDATE TO authenticated
  USING (true);

-- 4. Define Helper Functions with SECURITY DEFINER (bypasses RLS safely)
CREATE OR REPLACE FUNCTION public.claim_admin_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.admin_roles (user_id, role)
    VALUES (auth.uid(), 'super_admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';
    RETURN 'super_admin';
  END IF;
  RETURN 'unauthenticated';
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_admin_role() TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.get_user_admin_role(lookup_user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT role FROM public.admin_roles WHERE user_id = lookup_user_id LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_admin_role(uuid) TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- 5. Automatically assign super_admin to ALL existing users in auth.users
INSERT INTO public.admin_roles (user_id, role)
SELECT id, 'super_admin'
FROM auth.users
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';

-- 6. Ensure profile records exist for all users
INSERT INTO public.profiles (id, full_name, email)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', 'Administrator'),
  email
FROM auth.users
ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  full_name = COALESCE(profiles.full_name, EXCLUDED.full_name);

-- 7. Auto-grant super_admin trigger for any new accounts created
CREATE OR REPLACE FUNCTION public.handle_new_user_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.admin_roles (user_id, role)
  VALUES (NEW.id, 'super_admin')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Administrator'),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_admin();

-- 8. Orders & Order Items RLS Policies (Allow checkout for guests and customers)
DROP POLICY IF EXISTS "admins manage orders" ON public.orders;
DROP POLICY IF EXISTS "admins read all orders" ON public.orders;
DROP POLICY IF EXISTS "admins manage all orders" ON public.orders;
DROP POLICY IF EXISTS "role permissions read orders" ON public.orders;
DROP POLICY IF EXISTS "role permissions update orders" ON public.orders;
DROP POLICY IF EXISTS "public insert orders" ON public.orders;
DROP POLICY IF EXISTS "public update orders" ON public.orders;
DROP POLICY IF EXISTS "users read own orders" ON public.orders;
DROP POLICY IF EXISTS "authenticated read orders" ON public.orders;
DROP POLICY IF EXISTS "public read orders" ON public.orders;

CREATE POLICY "public insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "public update orders"
  ON public.orders FOR UPDATE
  USING (true);

CREATE POLICY "public read orders"
  ON public.orders FOR SELECT
  USING (true);

CREATE POLICY "admins manage all orders"
  ON public.orders FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
  );

-- Order Items
DROP POLICY IF EXISTS "admins manage order items" ON public.order_items;
DROP POLICY IF EXISTS "admins read all order_items" ON public.order_items;
DROP POLICY IF EXISTS "admins manage all order items" ON public.order_items;
DROP POLICY IF EXISTS "role permissions read order items" ON public.order_items;
DROP POLICY IF EXISTS "public insert order_items" ON public.order_items;
DROP POLICY IF EXISTS "users read own order items" ON public.order_items;
DROP POLICY IF EXISTS "authenticated read order items" ON public.order_items;
DROP POLICY IF EXISTS "public read order_items" ON public.order_items;

CREATE POLICY "public insert order_items"
  ON public.order_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "public read order_items"
  ON public.order_items FOR SELECT
  USING (true);

CREATE POLICY "admins manage all order items"
  ON public.order_items FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
  );

-- 9. Profiles Policies
DROP POLICY IF EXISTS "admins read profiles" ON public.profiles;
DROP POLICY IF EXISTS "authenticated read profiles" ON public.profiles;
DROP POLICY IF EXISTS "public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "users manage own profile" ON public.profiles;

CREATE POLICY "authenticated read profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
    OR auth.uid() = id
  );

CREATE POLICY "users manage own profile"
  ON public.profiles FOR ALL TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 10. Products, Images, Categories, and Inventory Policies
DROP POLICY IF EXISTS "public read active products" ON public.products;
DROP POLICY IF EXISTS "admins manage products" ON public.products;

CREATE POLICY "public read active products"
  ON public.products FOR SELECT
  USING (is_active = true OR EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()));

CREATE POLICY "admins manage products"
  ON public.products FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()));

-- Product Images
DROP POLICY IF EXISTS "public read product images" ON public.product_images;
DROP POLICY IF EXISTS "admins manage product images" ON public.product_images;

CREATE POLICY "public read product images"
  ON public.product_images FOR SELECT
  USING (true);

CREATE POLICY "admins manage product images"
  ON public.product_images FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()));

-- Categories
DROP POLICY IF EXISTS "public read categories" ON public.categories;
DROP POLICY IF EXISTS "admins manage categories" ON public.categories;

CREATE POLICY "public read categories"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "admins manage categories"
  ON public.categories FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()));

-- Inventory
DROP POLICY IF EXISTS "admins manage inventory" ON public.inventory;
CREATE POLICY "admins manage inventory"
  ON public.inventory FOR ALL TO authenticated
  USING (true);

-- Payments
DROP POLICY IF EXISTS "admins manage payments" ON public.payments;
DROP POLICY IF EXISTS "public insert payments" ON public.payments;
DROP POLICY IF EXISTS "public update payments" ON public.payments;
DROP POLICY IF EXISTS "public read payments" ON public.payments;

CREATE POLICY "public insert payments"
  ON public.payments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "public update payments"
  ON public.payments FOR UPDATE
  USING (true);

CREATE POLICY "public read payments"
  ON public.payments FOR SELECT
  USING (true);

CREATE POLICY "admins manage payments"
  ON public.payments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()));

-- 11. Verification Query
SELECT 
  u.id, 
  u.email, 
  ar.role, 
  ar.created_at
FROM auth.users u
LEFT JOIN public.admin_roles ar ON ar.user_id = u.id;

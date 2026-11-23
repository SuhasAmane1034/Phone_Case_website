-- ==============================================================================
-- Supabase Storage Setup for Product Images
-- ==============================================================================
-- Run this in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste and Run (Cmd+Enter / Ctrl+Enter)
-- ==============================================================================

-- 1. Create the public "product-images" bucket if it does not already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760, -- 10MB limit per image
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Allow public viewing of all product images
DROP POLICY IF EXISTS "Public Read Product Images" ON storage.objects;
CREATE POLICY "Public Read Product Images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- 3. Allow authenticated admins/users to upload product images
DROP POLICY IF EXISTS "Authenticated Upload Product Images" ON storage.objects;
CREATE POLICY "Authenticated Upload Product Images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images');

-- 4. Allow authenticated admins/users to update/overwrite product images
DROP POLICY IF EXISTS "Authenticated Update Product Images" ON storage.objects;
CREATE POLICY "Authenticated Update Product Images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images');

-- 5. Allow authenticated admins/users to delete product images
DROP POLICY IF EXISTS "Authenticated Delete Product Images" ON storage.objects;
CREATE POLICY "Authenticated Delete Product Images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images');

-- 6. Grant permissions & RLS on the public.product_images and public.products database tables
GRANT ALL ON TABLE public.products TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.product_images TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.categories TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "public read active products" ON public.products;
CREATE POLICY "public read active products"
  ON public.products FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "public read product images" ON public.product_images;
CREATE POLICY "public read product images"
  ON public.product_images FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "admins manage product images" ON public.product_images;
CREATE POLICY "admins manage product images"
  ON public.product_images FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
    OR true
  );

DROP POLICY IF EXISTS "public read categories" ON public.categories;
CREATE POLICY "public read categories"
  ON public.categories FOR SELECT
  USING (true);

-- 7. Verification: Check bucket and table
SELECT id, name, public, created_at FROM storage.buckets WHERE id = 'product-images';

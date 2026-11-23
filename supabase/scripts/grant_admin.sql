-- ==============================================================================
-- GHYAMAJHA Complete Admin Role & Permission Setup
-- ==============================================================================
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ==============================================================================

-- 1. Ensure RLS allows authenticated users to read admin_roles
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own admin role" ON public.admin_roles;
DROP POLICY IF EXISTS "authenticated read admin roles" ON public.admin_roles;
CREATE POLICY "authenticated read admin roles"
  ON public.admin_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. Define a SECURITY DEFINER function to bypass any RLS complications
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

-- 3. Ensure profiles exist for all users
INSERT INTO public.profiles (id, full_name)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', 'Admin')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 4. Assign super_admin to both accounts
INSERT INTO public.admin_roles (user_id, role)
SELECT id, 'super_admin'
FROM auth.users
WHERE email IN ('suhasbackup777@gmail.com', 'test@ghyamajha.com')
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';

-- 5. Verification output
SELECT u.id, u.email, ar.role, ar.created_at
FROM auth.users u
JOIN public.admin_roles ar ON ar.user_id = u.id;

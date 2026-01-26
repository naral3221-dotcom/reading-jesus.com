-- Fix profiles RLS policy to prevent infinite recursion and 406 errors
-- Drop existing problematic policies
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_public" ON profiles;

-- Create simple public read policy
CREATE POLICY "profiles_select_public" ON profiles
  FOR SELECT USING (true);

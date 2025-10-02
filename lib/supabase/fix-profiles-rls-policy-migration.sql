-- Drop the existing policy that only allows users to read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

-- Create a new policy to allow any authenticated user to view any profile
CREATE POLICY "Authenticated users can view profiles" ON public.profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

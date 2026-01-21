-- Drop the restrictive profiles SELECT policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create updated policy that allows county admins to see ALL profiles
CREATE POLICY "Users can view profiles"
ON public.profiles
FOR SELECT
USING (
  (id = auth.uid()) OR is_county_admin(auth.uid())
);
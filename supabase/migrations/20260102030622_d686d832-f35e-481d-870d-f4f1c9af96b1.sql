-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Anyone can insert registrations" ON public.registrations;

-- Recreate as a permissive policy (default behavior, no AS RESTRICTIVE)
CREATE POLICY "Anyone can insert registrations"
ON public.registrations
FOR INSERT
TO public
WITH CHECK (true);
-- Fix 1: Restrict profiles visibility to users only, or scoped to admin users
-- County admins can now only see profiles of users who have roles (other admins)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR
  (public.is_county_admin(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = profiles.id
  ))
);

-- Fix 2: Add unique constraint to prevent duplicate registrations per event/email
-- This prevents spam registrations with same email for same event
CREATE UNIQUE INDEX IF NOT EXISTS unique_email_per_event 
ON public.registrations (event_id, attendee_email) 
WHERE registration_status != 'cancelled';
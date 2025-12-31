-- Fix storage bucket policies for event-images
-- Remove overly permissive policies and add role-based access control

-- First, drop existing policies for event-images bucket
DROP POLICY IF EXISTS "Allow authenticated users to upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update event images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete event images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view event images" ON storage.objects;

-- Create restricted policies that only allow admins to manage images

-- Public can view event images (read-only)
CREATE POLICY "Anyone can view event images"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-images');

-- Only county admins or church admins can upload event images
CREATE POLICY "Admins can upload event images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-images' 
  AND auth.role() = 'authenticated'
  AND (
    is_county_admin(auth.uid()) 
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'church_admin'
    )
  )
);

-- Only county admins or church admins can update event images
CREATE POLICY "Admins can update event images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'event-images' 
  AND auth.role() = 'authenticated'
  AND (
    is_county_admin(auth.uid()) 
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'church_admin'
    )
  )
);

-- Only county admins or church admins can delete event images
CREATE POLICY "Admins can delete event images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'event-images' 
  AND auth.role() = 'authenticated'
  AND (
    is_county_admin(auth.uid()) 
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'church_admin'
    )
  )
);
-- Add external registration URL and unlimited capacity flag to events
ALTER TABLE public.events 
ADD COLUMN has_unlimited_capacity boolean NOT NULL DEFAULT false,
ADD COLUMN external_registration_url text;
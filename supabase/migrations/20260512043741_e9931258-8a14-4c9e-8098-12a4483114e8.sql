ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS registration_fields jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS additional_info jsonb NOT NULL DEFAULT '{}'::jsonb;
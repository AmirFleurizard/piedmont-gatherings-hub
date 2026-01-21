-- Create pending_invites table for invite-only user registration
CREATE TABLE public.pending_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT,
  role public.app_role NOT NULL,
  church_id UUID REFERENCES public.churches(id) ON DELETE SET NULL,
  invite_token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_pending_email UNIQUE (email)
);

-- Enable RLS
ALTER TABLE public.pending_invites ENABLE ROW LEVEL SECURITY;

-- County admins can manage all invites
CREATE POLICY "County admins can manage invites"
ON public.pending_invites
FOR ALL
USING (public.is_county_admin(auth.uid()));

-- Public can read their own invite by token (for acceptance flow)
CREATE POLICY "Anyone can read invite by token"
ON public.pending_invites
FOR SELECT
USING (true);

-- Create index for faster token lookups
CREATE INDEX idx_pending_invites_token ON public.pending_invites(invite_token);
CREATE INDEX idx_pending_invites_email ON public.pending_invites(email);
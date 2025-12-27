-- Create role enum
CREATE TYPE public.app_role AS ENUM ('county_admin', 'church_admin');

-- Create churches table
CREATE TABLE public.churches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  pastor TEXT,
  location TEXT,
  phone TEXT,
  website TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, church_id)
);

-- Create profiles table for admin users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 100,
  spots_remaining INTEGER NOT NULL DEFAULT 100,
  is_free BOOLEAN NOT NULL DEFAULT true,
  price DECIMAL(10,2) DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create registrations table
CREATE TABLE public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  attendee_name TEXT NOT NULL,
  attendee_email TEXT NOT NULL,
  attendee_phone TEXT,
  num_tickets INTEGER NOT NULL DEFAULT 1,
  total_amount DECIMAL(10,2) DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'cancelled')),
  registration_status TEXT NOT NULL DEFAULT 'pending' CHECK (registration_status IN ('pending', 'confirmed', 'cancelled')),
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  hold_expires_at TIMESTAMPTZ,
  confirmation_sent BOOLEAN NOT NULL DEFAULT false,
  checked_in BOOLEAN NOT NULL DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is county admin
CREATE OR REPLACE FUNCTION public.is_county_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'county_admin')
$$;

-- Function to check if user can manage a church
CREATE OR REPLACE FUNCTION public.can_manage_church(_user_id UUID, _church_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (role = 'county_admin' OR (role = 'church_admin' AND church_id = _church_id))
  )
$$;

-- Churches policies
CREATE POLICY "Churches are viewable by everyone"
ON public.churches FOR SELECT
USING (true);

CREATE POLICY "County admins can insert churches"
ON public.churches FOR INSERT
TO authenticated
WITH CHECK (public.is_county_admin(auth.uid()));

CREATE POLICY "County admins can update churches"
ON public.churches FOR UPDATE
TO authenticated
USING (public.is_county_admin(auth.uid()));

CREATE POLICY "County admins can delete churches"
ON public.churches FOR DELETE
TO authenticated
USING (public.is_county_admin(auth.uid()));

-- User roles policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_county_admin(auth.uid()));

CREATE POLICY "County admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.is_county_admin(auth.uid()));

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid() OR public.is_county_admin(auth.uid()));

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Events policies
CREATE POLICY "Published events are viewable by everyone"
ON public.events FOR SELECT
USING (is_published = true OR (auth.uid() IS NOT NULL AND public.can_manage_church(auth.uid(), church_id)));

CREATE POLICY "Admins can insert events for their churches"
ON public.events FOR INSERT
TO authenticated
WITH CHECK (public.can_manage_church(auth.uid(), church_id));

CREATE POLICY "Admins can update events for their churches"
ON public.events FOR UPDATE
TO authenticated
USING (public.can_manage_church(auth.uid(), church_id));

CREATE POLICY "Admins can delete events for their churches"
ON public.events FOR DELETE
TO authenticated
USING (public.can_manage_church(auth.uid(), church_id));

-- Registrations policies
CREATE POLICY "Registrations are viewable by event admins"
ON public.registrations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id
    AND public.can_manage_church(auth.uid(), e.church_id)
  )
);

CREATE POLICY "Anyone can insert registrations"
ON public.registrations FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can update registrations"
ON public.registrations FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id
    AND public.can_manage_church(auth.uid(), e.church_id)
  )
);

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_churches_updated_at
  BEFORE UPDATE ON public.churches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_registrations_updated_at
  BEFORE UPDATE ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to atomically reserve spots
CREATE OR REPLACE FUNCTION public.reserve_event_spots(
  _event_id UUID,
  _num_tickets INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_spots INTEGER;
BEGIN
  -- Lock the row and get current spots
  SELECT spots_remaining INTO current_spots
  FROM public.events
  WHERE id = _event_id
  FOR UPDATE;
  
  IF current_spots IS NULL THEN
    RETURN FALSE;
  END IF;
  
  IF current_spots < _num_tickets THEN
    RETURN FALSE;
  END IF;
  
  -- Decrement spots
  UPDATE public.events
  SET spots_remaining = spots_remaining - _num_tickets
  WHERE id = _event_id;
  
  RETURN TRUE;
END;
$$;

-- Function to release spots
CREATE OR REPLACE FUNCTION public.release_event_spots(
  _event_id UUID,
  _num_tickets INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.events
  SET spots_remaining = LEAST(capacity, spots_remaining + _num_tickets)
  WHERE id = _event_id;
END;
$$;

-- Function to release expired holds (called by scheduled job or edge function)
CREATE OR REPLACE FUNCTION public.release_expired_holds()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  released_count INTEGER := 0;
  reg RECORD;
BEGIN
  FOR reg IN
    SELECT id, event_id, num_tickets
    FROM public.registrations
    WHERE payment_status = 'pending'
      AND hold_expires_at IS NOT NULL
      AND hold_expires_at < now()
  LOOP
    -- Release the spots
    PERFORM public.release_event_spots(reg.event_id, reg.num_tickets);
    
    -- Mark registration as cancelled
    UPDATE public.registrations
    SET registration_status = 'cancelled',
        payment_status = 'cancelled'
    WHERE id = reg.id;
    
    released_count := released_count + 1;
  END LOOP;
  
  RETURN released_count;
END;
$$;
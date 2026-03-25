ALTER TABLE public.profiles ADD COLUMN username text UNIQUE;

CREATE UNIQUE INDEX profiles_username_lower_idx ON public.profiles (lower(username));

-- Function to check username availability (public, no auth needed for real-time check)
CREATE OR REPLACE FUNCTION public.check_username_available(p_username text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE lower(username) = lower(p_username)
  )
$$;
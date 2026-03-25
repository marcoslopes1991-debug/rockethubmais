
-- Create reserved_usernames table
CREATE TABLE public.reserved_usernames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  descricao text DEFAULT '',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Unique constraint on lowercase username
CREATE UNIQUE INDEX reserved_usernames_username_lower_idx ON public.reserved_usernames (lower(username));

-- Enable RLS
ALTER TABLE public.reserved_usernames ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage reserved_usernames" ON public.reserved_usernames
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read active reserved_usernames" ON public.reserved_usernames
  FOR SELECT TO public
  USING (true);

-- Update check_username_available to also check reserved usernames
CREATE OR REPLACE FUNCTION public.check_username_available(p_username text)
  RETURNS boolean
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE lower(username) = lower(p_username)
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.reserved_usernames WHERE lower(username) = lower(p_username) AND ativo = true
  )
$$;


-- Create ads table
CREATE TABLE public.ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  link_url TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  frequency INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone authenticated can view active ads"
ON public.ads FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can insert ads"
ON public.ads FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update ads"
ON public.ads FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ads"
ON public.ads FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_ads_updated_at
BEFORE UPDATE ON public.ads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add premium flag to profiles
ALTER TABLE public.profiles ADD COLUMN is_premium BOOLEAN NOT NULL DEFAULT false;

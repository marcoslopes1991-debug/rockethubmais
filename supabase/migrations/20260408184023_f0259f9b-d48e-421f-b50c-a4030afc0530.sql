
-- Add priority field to ads
ALTER TABLE public.ads ADD COLUMN priority text NOT NULL DEFAULT 'normal';

-- Add per-user impression limit (null = unlimited)
ALTER TABLE public.ads ADD COLUMN max_impressions_per_user integer DEFAULT NULL;

-- Add total impression limit (null = unlimited)
ALTER TABLE public.ads ADD COLUMN max_impressions_total integer DEFAULT NULL;

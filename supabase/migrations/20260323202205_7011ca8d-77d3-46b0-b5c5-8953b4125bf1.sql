
ALTER TABLE public.questions 
ADD COLUMN mission_type text NOT NULL DEFAULT 'daily',
ADD COLUMN available_from timestamp with time zone DEFAULT NULL,
ADD COLUMN available_until timestamp with time zone DEFAULT NULL;

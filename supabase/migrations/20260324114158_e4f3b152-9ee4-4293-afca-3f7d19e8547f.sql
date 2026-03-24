ALTER TABLE public.notifications
  ADD COLUMN action_url text DEFAULT NULL,
  ADD COLUMN reference_id text DEFAULT NULL;
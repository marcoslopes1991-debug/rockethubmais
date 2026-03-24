
CREATE TABLE public.mission_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_question_count integer NOT NULL DEFAULT 5,
  extra_question_count integer,
  special_question_count integer,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.mission_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read mission_config" ON public.mission_config
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can update mission_config" ON public.mission_config
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert mission_config" ON public.mission_config
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert default row
INSERT INTO public.mission_config (daily_question_count, extra_question_count, special_question_count)
VALUES (5, NULL, NULL);

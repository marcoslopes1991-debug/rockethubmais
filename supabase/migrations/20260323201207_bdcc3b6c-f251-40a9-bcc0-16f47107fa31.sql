-- Create storage bucket for AI config images
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-config', 'ai-config', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated admins to upload
CREATE POLICY "Admins can upload ai-config" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ai-config' AND public.has_role(auth.uid(), 'admin'));

-- Allow authenticated admins to update
CREATE POLICY "Admins can update ai-config" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'ai-config' AND public.has_role(auth.uid(), 'admin'));

-- Allow authenticated admins to delete
CREATE POLICY "Admins can delete ai-config" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'ai-config' AND public.has_role(auth.uid(), 'admin'));

-- Allow public read
CREATE POLICY "Public can read ai-config" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'ai-config');

-- Create ai_config table (single row config)
CREATE TABLE public.ai_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_name text NOT NULL DEFAULT 'RockZ',
  button_image_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_config ENABLE ROW LEVEL SECURITY;

-- Everyone can read config
CREATE POLICY "Anyone can read ai_config" ON public.ai_config
  FOR SELECT TO public USING (true);

-- Only admins can update
CREATE POLICY "Admins can update ai_config" ON public.ai_config
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert ai_config" ON public.ai_config
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default row
INSERT INTO public.ai_config (ai_name) VALUES ('RockZ');
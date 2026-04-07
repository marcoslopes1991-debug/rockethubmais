
CREATE TABLE public.ad_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id uuid NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  user_id uuid,
  event_type text NOT NULL CHECK (event_type IN ('impression', 'click')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_ad_events_ad_id ON public.ad_events(ad_id);
CREATE INDEX idx_ad_events_type ON public.ad_events(event_type);

ALTER TABLE public.ad_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert ad events"
  ON public.ad_events FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all ad events"
  ON public.ad_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

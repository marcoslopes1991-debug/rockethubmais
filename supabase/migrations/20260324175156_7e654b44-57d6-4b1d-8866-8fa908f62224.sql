CREATE POLICY "Users can insert social notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (type = 'social');
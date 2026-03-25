
-- Add status column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Migrate existing blocked data
UPDATE public.profiles SET status = 'blocked' WHERE blocked = true;

-- Create function for admin to permanently delete a user
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admins can call this
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Delete associated data
  DELETE FROM public.user_achievements WHERE user_id = target_user_id;
  DELETE FROM public.user_items WHERE user_id = target_user_id;
  DELETE FROM public.answers WHERE user_id = target_user_id;
  DELETE FROM public.follows WHERE follower_id = target_user_id OR following_id = target_user_id;
  DELETE FROM public.notifications WHERE user_id = target_user_id;
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE user_id = target_user_id;
  
  -- Delete auth user
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

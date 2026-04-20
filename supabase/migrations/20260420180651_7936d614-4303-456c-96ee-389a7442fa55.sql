
-- Função que detecta links no conteúdo do post
CREATE OR REPLACE FUNCTION public.post_contains_link(_content text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
BEGIN
  IF _content IS NULL OR _content = '' THEN
    RETURN false;
  END IF;

  -- Detecta http://, https://, www., domínios comuns e encurtadores
  RETURN _content ~* '(https?://\S+)|(www\.\S+)|(\m\S+\.(com|br|net|org|io|co|gov|edu|info|biz|app|dev|me|tv|xyz|site|online|store|tech|us|uk|de|fr|es|it|pt|ar|mx|cl|ca|au|jp|cn|ru|in)(/\S*)?\M)|(\m(bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|is\.gd|buff\.ly|adf\.ly|shorte\.st|cutt\.ly|rebrand\.ly|short\.io|rb\.gy|t\.me)/\S*)';
END;
$$;

-- Trigger que bloqueia inserts/updates de posts com links por usuários não-admin
CREATE OR REPLACE FUNCTION public.validate_post_no_links()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Admins podem publicar links livremente
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF public.post_contains_link(NEW.content) THEN
    RAISE EXCEPTION 'Links não são permitidos nas publicações.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS posts_block_links ON public.posts;
CREATE TRIGGER posts_block_links
  BEFORE INSERT OR UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_post_no_links();


-- Onboarding modules table
CREATE TABLE public.onboarding_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active modules" ON public.onboarding_modules FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage modules" ON public.onboarding_modules FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Onboarding courses table
CREATE TABLE public.onboarding_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active courses" ON public.onboarding_courses FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage courses" ON public.onboarding_courses FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Add onboarding profile columns
ALTER TABLE public.profiles
  ADD COLUMN modulos_interesse text[] DEFAULT '{}',
  ADD COLUMN trabalha_com_sap boolean,
  ADD COLUMN perfil_sap text,
  ADD COLUMN tempo_experiencia_sap text,
  ADD COLUMN cursos_rockethub text[] DEFAULT '{}';

-- Add welcome message to ai_config
ALTER TABLE public.ai_config ADD COLUMN welcome_message text NOT NULL DEFAULT 'Parabéns! Você concluiu seu cadastro. Estamos felizes em ter você aqui. Prepare-se para uma jornada incrível de aprendizado!';

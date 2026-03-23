
-- Achievements definition table
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon_emoji text NOT NULL DEFAULT '🏆',
  category text NOT NULL DEFAULT 'geral',
  condition_type text NOT NULL, -- 'streak', 'xp', 'correct_answers'
  condition_value integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Achievements viewable by authenticated" ON public.achievements
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert achievements" ON public.achievements
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update achievements" ON public.achievements
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete achievements" ON public.achievements
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- User achievements (unlocked badges)
CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements" ON public.user_achievements
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON public.user_achievements
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all achievements" ON public.user_achievements
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Seed default achievements
INSERT INTO public.achievements (key, name, description, icon_emoji, category, condition_type, condition_value) VALUES
  ('streak_3', 'Consistente', '3 dias seguidos de estudo', '🔥', 'streak', 'streak', 3),
  ('streak_7', 'Dedicado', '7 dias seguidos de estudo', '💪', 'streak', 'streak', 7),
  ('streak_14', 'Imparável', '14 dias seguidos de estudo', '⚡', 'streak', 'streak', 14),
  ('streak_30', 'Lendário', '30 dias seguidos de estudo', '👑', 'streak', 'streak', 30),
  ('xp_100', 'Primeiros Passos', 'Alcançou 100 XP', '⭐', 'xp', 'xp', 100),
  ('xp_500', 'Em Ascensão', 'Alcançou 500 XP', '🌟', 'xp', 'xp', 500),
  ('xp_1000', 'Mil Pontos', 'Alcançou 1.000 XP', '💎', 'xp', 'xp', 1000),
  ('xp_5000', 'Expert', 'Alcançou 5.000 XP', '🏅', 'xp', 'xp', 5000),
  ('correct_10', 'Aprendiz', 'Acertou 10 perguntas', '📚', 'correct_answers', 'correct_answers', 10),
  ('correct_50', 'Estudioso', 'Acertou 50 perguntas', '🎯', 'correct_answers', 'correct_answers', 50),
  ('correct_100', 'Mestre', 'Acertou 100 perguntas', '🧠', 'correct_answers', 'correct_answers', 100),
  ('correct_500', 'Sábio', 'Acertou 500 perguntas', '🏆', 'correct_answers', 'correct_answers', 500);

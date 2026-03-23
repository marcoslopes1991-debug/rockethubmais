
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  xp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option TEXT NOT NULL CHECK (correct_option IN ('a', 'b', 'c', 'd')),
  explanation TEXT NOT NULL DEFAULT '',
  xp_reward INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Questions viewable by authenticated" ON public.questions FOR SELECT TO authenticated USING (true);

-- Create answers table
CREATE TABLE public.answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option TEXT NOT NULL CHECK (selected_option IN ('a', 'b', 'c', 'd')),
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own answers" ON public.answers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own answers" ON public.answers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed some questions
INSERT INTO public.questions (question, option_a, option_b, option_c, option_d, correct_option, explanation, xp_reward) VALUES
('Qual é a capital do Brasil?', 'São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'c', 'Brasília é a capital federal do Brasil desde 1960.', 10),
('Qual planeta é conhecido como Planeta Vermelho?', 'Vênus', 'Marte', 'Júpiter', 'Saturno', 'b', 'Marte é chamado de Planeta Vermelho devido ao óxido de ferro em sua superfície.', 10),
('Quanto é 7 x 8?', '54', '48', '56', '64', 'c', '7 multiplicado por 8 é igual a 56.', 10),
('Qual é o maior oceano do mundo?', 'Atlântico', 'Índico', 'Ártico', 'Pacífico', 'd', 'O Oceano Pacífico é o maior oceano, cobrindo mais de 30% da superfície da Terra.', 10),
('Quem pintou a Mona Lisa?', 'Michelangelo', 'Leonardo da Vinci', 'Rafael', 'Donatello', 'b', 'A Mona Lisa foi pintada por Leonardo da Vinci no início do século XVI.', 10),
('Qual é o elemento químico representado pelo símbolo "O"?', 'Ouro', 'Ósmio', 'Oxigênio', 'Óglio', 'c', 'O símbolo "O" representa o Oxigênio na tabela periódica.', 10),
('Em que ano o homem pisou na Lua pela primeira vez?', '1965', '1969', '1971', '1973', 'b', 'Neil Armstrong foi o primeiro homem a pisar na Lua em 20 de julho de 1969.', 15),
('Qual é a fórmula da água?', 'H2O', 'CO2', 'NaCl', 'O2', 'a', 'A fórmula química da água é H2O (dois átomos de hidrogênio e um de oxigênio).', 10),
('Qual é o maior país do mundo em área territorial?', 'China', 'Estados Unidos', 'Canadá', 'Rússia', 'd', 'A Rússia é o maior país do mundo com mais de 17 milhões de km².', 10),
('Quantos lados tem um hexágono?', '5', '6', '7', '8', 'b', 'Um hexágono tem 6 lados. O prefixo "hexa" significa seis.', 10);


-- Add streak and level fields to profiles
ALTER TABLE public.profiles 
  ADD COLUMN streak_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN last_activity_date DATE;

-- Create items table
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('roupa', 'acessorio', 'equipamento')),
  icon_emoji TEXT NOT NULL DEFAULT '🎁',
  required_xp INTEGER NOT NULL DEFAULT 0,
  required_level INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Items viewable by authenticated" ON public.items FOR SELECT TO authenticated USING (true);

-- Create user_items table
CREATE TABLE public.user_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  equipped BOOLEAN NOT NULL DEFAULT false,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);

ALTER TABLE public.user_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own items" ON public.user_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own items" ON public.user_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own items" ON public.user_items FOR UPDATE USING (auth.uid() = user_id);

-- Seed items
INSERT INTO public.items (name, description, category, icon_emoji, required_xp, required_level) VALUES
('Crachá de Estagiário', 'O primeiro passo na jornada', 'acessorio', '🪪', 0, 0),
('Caderno de Anotações', 'Para nunca esquecer os aprendizados', 'equipamento', '📒', 20, 0),
('Camisa Polo', 'Uniforme do consultor dedicado', 'roupa', '👔', 50, 1),
('Óculos de Sabedoria', 'Enxergue além do óbvio', 'acessorio', '🤓', 80, 1),
('Laptop Pro', 'Ferramenta essencial do consultor', 'equipamento', '💻', 150, 2),
('Terno Executivo', 'Visual de quem manda bem', 'roupa', '🤵', 200, 2),
('Relógio de Ouro', 'Tempo é dinheiro', 'acessorio', '⌚', 300, 3),
('Mala de Viagem', 'Pronto para projetos internacionais', 'equipamento', '🧳', 350, 3),
('Coroa do Sênior', 'Símbolo máximo de conhecimento', 'acessorio', '👑', 500, 4),
('Capa de Herói', 'Lenda da consultoria', 'roupa', '🦸', 500, 4);

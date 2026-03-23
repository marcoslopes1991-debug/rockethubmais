
CREATE TABLE public.levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_number integer NOT NULL UNIQUE,
  name text NOT NULL,
  min_xp integer NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Levels viewable by authenticated" ON public.levels
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert levels" ON public.levels
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update levels" ON public.levels
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete levels" ON public.levels
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.levels (level_number, name, min_xp, description) VALUES
(1, 'Usuário', 0, 'Você acaba de entrar no mundo SAP SD. Tudo é novo e desafiador — mas toda jornada começa com o primeiro passo.'),
(2, 'Key User em Evolução', 50, 'Já conhece o básico e começa a se destacar entre os usuários. Você entende processos e já navega pelas transações com mais confiança.'),
(3, 'Aspirante a Consultor', 120, 'Seu conhecimento vai além do operacional. Você começa a entender a lógica por trás das configurações e quer aprender mais.'),
(4, 'Consultor Perdido', 220, 'Bem-vindo ao mundo da consultoria! Tudo parece confuso no início — customizings, fluxos, integrações — mas você está no caminho certo.'),
(5, 'Consultor Júnior I', 350, 'Você já entende a estrutura organizacional do SD e consegue configurar processos básicos de vendas com supervisão.'),
(6, 'Consultor Júnior II', 500, 'Domina determinações de preço, tipos de documento e fluxos de faturamento. Já resolve chamados de baixa complexidade sozinho.'),
(7, 'Consultor Júnior III', 700, 'Você é referência entre os juniores. Conhece integrações com MM e FI e começa a atuar em projetos de implementação.'),
(8, 'Consultor Pleno I', 950, 'Atua com autonomia em projetos. Configura cenários complexos de pricing, partner determination e output management.'),
(9, 'Consultor Pleno II', 1250, 'Lidera frentes de trabalho em projetos. Conhece profundamente BADI, user exits e enhancements do módulo SD.'),
(10, 'Consultor Pleno III', 1600, 'Você é o ponto focal técnico do time. Resolve problemas críticos em produção e mentora consultores juniores.'),
(11, 'Consultor Sênior I', 2000, 'Referência técnica reconhecida. Desenha soluções end-to-end e lidera workshops com áreas de negócio.'),
(12, 'Consultor Sênior II', 2500, 'Atua como arquiteto de soluções SD. Define padrões, boas práticas e estratégias de rollout para múltiplas plantas.'),
(13, 'Consultor Sênior III', 3200, 'Autoridade no módulo SD. Consultor estratégico que influencia decisões de negócio e lidera programas de transformação.'),
(14, 'Consultor Especialista', 4000, 'O topo da jornada. Você domina o SAP SD como poucos. Seu conhecimento transcende o técnico — você transforma organizações.');

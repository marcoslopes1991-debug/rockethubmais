import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    const { messages, userContext } = await req.json();

    // Build system prompt with user context
    let systemPrompt = `Você é o RockZ, um assistente de aprendizado inteligente e amigável especializado em SAP SD (Sales & Distribution).

Sua personalidade:
- Você é animado, encorajador e usa uma linguagem acessível
- Você adora ajudar os alunos a entenderem conceitos de SAP SD
- Use emojis ocasionalmente para ser mais amigável 🚀
- Seja direto e objetivo nas respostas
- Quando não souber algo, seja honesto

Você pode ajudar com:
- Explicar conceitos de SAP SD (pedidos de venda, remessas, faturamento, etc.)
- Esclarecer dúvidas sobre perguntas do quiz
- Dar dicas de estudo e orientação
- Explicar processos de negócio relacionados a vendas e distribuição
- Motivar o aluno a continuar estudando`;

    if (userContext) {
      systemPrompt += `\n\nContexto do aluno:
- Nome: ${userContext.displayName || "Estudante"}
- Nível atual: ${userContext.levelName || "Iniciante"} (Nível ${userContext.levelNumber || 1})
- XP: ${userContext.xp || 0}
- Sequência de estudo: ${userContext.streak || 0} dias
- Progresso: ${userContext.progress || 0}%

Use essas informações para personalizar suas respostas e motivar o aluno de acordo com seu nível.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao conectar com a IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("rockz-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

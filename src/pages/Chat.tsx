import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useLevels, getLevelFromList } from "@/hooks/useLevels";
import { useAiConfig } from "@/hooks/useAiConfig";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import rockzMascot from "@/assets/rockz-mascot.png";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rockz-chat`;

const QUICK_ACTIONS = [
  "Me explica essa pergunta",
  "O que estudar agora?",
  "Onde estou errando?",
  "O que é SAP SD?",
  "Dicas de estudo",
];

export default function Chat() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { levels } = useLevels();
  const { config: aiConfig } = useAiConfig();
  const aiName = aiConfig?.ai_name || "RockZ";
  const aiImage = aiConfig?.button_image_url || rockzMascot;

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, xp, streak_count").eq("user_id", user.id).single().then(({ data }) => {
      if (data) setProfile(data);
    });
    supabase.from("answers").select("id", { count: "exact", head: true }).eq("user_id", user.id).then(({ count }) => setAnsweredCount(count ?? 0));
    supabase.from("questions").select("id", { count: "exact", head: true }).then(({ count }) => setTotalQuestions(count ?? 0));
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const getUserContext = () => {
    if (!profile || levels.length === 0) return undefined;
    const level = getLevelFromList(levels, profile.xp);
    return {
      displayName: profile.display_name,
      levelName: level.name,
      levelNumber: level.level_number,
      xp: profile.xp,
      streak: profile.streak_count,
      progress: totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0,
    };
  };

  const send = async (text?: string) => {
    const msg = text?.trim() || input.trim();
    if (!msg || loading) return;
    setInput("");
    const userMsg: Msg = { role: "user", content: msg };
    setMessages((p) => [...p, userMsg]);
    setLoading(true);

    let assistantSoFar = "";
    const allMessages = [...messages, userMsg];

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages, userContext: getUserContext() }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Erro de conexão");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) {
              assistantSoFar += c;
              setMessages((p) => {
                const last = p[p.length - 1];
                if (last?.role === "assistant") return p.map((m, i) => (i === p.length - 1 ? { ...m, content: assistantSoFar } : m));
                return [...p, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {}
        }
      }
    } catch (e: any) {
      setMessages((p) => [...p, { role: "assistant", content: `❌ ${e.message || "Erro ao se comunicar com o assistente"}` }]);
    }
    setLoading(false);
  };

  const showWelcome = messages.length === 0;

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground shadow-md shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-white/20 h-9 w-9"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <img src={aiImage} alt={aiName} width={40} height={40} className="rounded-full bg-white/20" />
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-bold text-base leading-tight">{aiName}</h1>
          <p className="text-xs opacity-80">Assistente IA • SAP SD</p>
        </div>
      </header>

      {/* Messages area */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {showWelcome && (
            <div className="text-center py-12 space-y-4">
              <img src={aiImage} alt={aiName} width={96} height={96} className="mx-auto rounded-full" loading="lazy" />
              <h2 className="text-xl font-display font-bold text-foreground">Olá! Eu sou o {aiName} 🤖</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Seu assistente de aprendizado SAP SD. Pergunte qualquer coisa sobre vendas e distribuição!
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {QUICK_ACTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="text-sm bg-secondary text-secondary-foreground px-4 py-2 rounded-full hover:bg-secondary/80 transition-colors border border-border"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`mb-4 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <img src={aiImage} alt={aiName} width={32} height={32} className="rounded-full mr-2 mt-1 shrink-0 self-start" />
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary text-secondary-foreground rounded-bl-md"
                }`}
              >
                {m.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))}

          {loading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start mb-4">
              <img src={aiImage} alt={aiName} width={32} height={32} className="rounded-full mr-2 mt-1 shrink-0" />
              <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {!showWelcome && !loading && messages.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2 mb-4">
              {QUICK_ACTIONS.slice(0, 3).map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-xs bg-secondary/60 text-secondary-foreground px-3 py-1.5 rounded-full hover:bg-secondary transition-colors border border-border/50"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="shrink-0 border-t border-border bg-card px-4 py-3">
        <div className="max-w-2xl mx-auto flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Digite sua pergunta..."
            className="flex-1 bg-secondary text-sm rounded-xl px-4 py-3 outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 text-foreground"
            disabled={loading}
          />
          <Button
            size="icon"
            className="rounded-xl h-11 w-11 shrink-0"
            onClick={() => send()}
            disabled={loading || !input.trim()}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

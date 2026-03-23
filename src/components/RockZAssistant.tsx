import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles } from "lucide-react";
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

export default function RockZAssistant() {
  const { user } = useAuth();
  const { levels } = useLevels();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

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

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: Msg = { role: "user", content: text };
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
      setMessages((p) => [...p, { role: "assistant", content: `❌ ${e.message || "Erro ao se comunicar com RockZ"}` }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 rounded-full shadow-xl bg-primary p-1 hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-primary"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        aria-label="Abrir assistente RockZ"
      >
        <img src={rockzMascot} alt="RockZ" width={56} height={56} className="rounded-full" />
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[70vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground">
              <img src={rockzMascot} alt="RockZ" width={36} height={36} className="rounded-full bg-white/20" />
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-sm">RockZ - Assistente IA</h3>
                <p className="text-xs opacity-80">Especialista em SAP SD</p>
              </div>
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/20 h-8 w-8" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {messages.length === 0 && (
                <div className="text-center py-8 space-y-3">
                  <img src={rockzMascot} alt="RockZ" width={80} height={80} className="mx-auto" loading="lazy" />
                  <p className="text-sm font-medium">Olá! Eu sou o RockZ 🤖</p>
                  <p className="text-xs text-muted-foreground">Seu assistente de aprendizado SAP SD. Pergunte qualquer coisa!</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-3">
                    {["O que é SAP SD?", "Dicas de estudo", "Explique pedido de venda"].map((q) => (
                      <button
                        key={q}
                        onClick={() => { setInput(q); }}
                        className="text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full hover:bg-secondary/80 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`mb-3 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
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
                <div className="flex justify-start mb-3">
                  <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-border p-3 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                placeholder="Pergunte algo..."
                className="flex-1 bg-secondary text-sm rounded-xl px-3.5 py-2 outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
                disabled={loading}
              />
              <Button size="icon" className="rounded-xl h-9 w-9 shrink-0" onClick={send} disabled={loading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

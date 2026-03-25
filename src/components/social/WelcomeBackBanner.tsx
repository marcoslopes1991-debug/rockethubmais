import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import confetti from "canvas-confetti";

const LAST_SEEN_KEY = "app_last_seen_at";

export default function WelcomeBackBanner() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const checkReturn = async () => {
      const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
      // Always update last seen
      localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());

      if (!lastSeen) return;

      const hoursAway = (Date.now() - new Date(lastSeen).getTime()) / (1000 * 60 * 60);
      if (hoursAway < 6) return;

      // Count followers gained since lastSeen
      const { count } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", user.id)
        .gte("created_at", lastSeen);

      if (count && count > 0) {
        setNewCount(count);
        setVisible(true);

        // Light confetti
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.3 },
          colors: ["hsl(var(--primary))", "hsl(var(--accent))", "#FFD700"],
        });

        setTimeout(() => setVisible(false), 8000);
      }
    };

    checkReturn();
  }, [user]);

  // Keep updating last seen
  useEffect(() => {
    const interval = setInterval(() => {
      localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90vw]"
        >
          <div className="relative flex items-center gap-3 px-5 py-4 rounded-2xl bg-card border border-border shadow-2xl">
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ repeat: 2, duration: 0.4 }}
            >
              <Users className="h-6 w-6 text-primary shrink-0" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">Bem-vindo de volta! 🚀</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enquanto você estava fora, ganhou{" "}
                <span className="font-bold text-primary">
                  {newCount} {newCount === 1 ? "novo seguidor" : "novos seguidores"}
                </span>
              </p>
            </div>
            <button onClick={() => setVisible(false)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

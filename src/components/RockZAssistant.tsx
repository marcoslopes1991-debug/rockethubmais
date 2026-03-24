import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAiConfig } from "@/hooks/useAiConfig";
import rockzMascot from "@/assets/rockz-mascot.png";

export default function RockZAssistant() {
  const navigate = useNavigate();
  const location = useLocation();
  const { config: aiConfig } = useAiConfig();
  const aiName = aiConfig?.ai_name || "RockZ";
  const aiImage = aiConfig?.button_image_url || rockzMascot;
  const [showHint, setShowHint] = useState(false);

  // Show hint after 5s, hide after 10s
  useEffect(() => {
    const showTimer = setTimeout(() => setShowHint(true), 5000);
    const hideTimer = setTimeout(() => setShowHint(false), 12000);
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, [location.pathname]);

  if (location.pathname === "/chat") return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-end gap-2">
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.9 }}
            className="px-3 py-1.5 rounded-xl bg-card border border-border shadow-lg text-xs font-medium text-foreground whitespace-nowrap mb-3"
          >
            Posso te ajudar 👀
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        onClick={() => navigate("/chat")}
        className="relative rounded-full shadow-xl bg-primary p-1 hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-primary"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        aria-label={`Abrir assistente ${aiName}`}
      >
        <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-accent" />
        </span>
        <img src={aiImage} alt={aiName} width={56} height={56} className="rounded-full" />
      </motion.button>
    </div>
  );
}

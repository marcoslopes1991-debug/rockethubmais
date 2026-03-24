import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAiConfig } from "@/hooks/useAiConfig";
import rockzMascot from "@/assets/rockz-mascot.png";

export default function RockZAssistant() {
  const navigate = useNavigate();
  const location = useLocation();
  const { config: aiConfig } = useAiConfig();
  const aiName = aiConfig?.ai_name || "RockZ";
  const aiImage = aiConfig?.button_image_url || rockzMascot;

  // Hide button on the chat page itself
  if (location.pathname === "/chat") return null;

  return (
    <motion.button
      onClick={() => navigate("/chat")}
      className="fixed bottom-6 right-6 z-50 rounded-full shadow-xl bg-primary p-1 hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-primary"
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
      aria-label={`Abrir assistente ${aiName}`}
    >
      <img src={aiImage} alt={aiName} width={56} height={56} className="rounded-full" />
    </motion.button>
  );
}

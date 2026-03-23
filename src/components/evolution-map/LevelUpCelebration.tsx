import { motion, AnimatePresence } from "framer-motion";
import { getAvatarForLevel } from "@/lib/levels";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DbLevel } from "@/hooks/useLevels";

interface Props {
  level: DbLevel | null;
  onClose: () => void;
}

const LevelUpCelebration = ({ level, onClose }: Props) => {
  if (!level) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl"
          initial={{ scale: 0.5, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", damping: 15, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glow ring */}
          <motion.div
            className="mx-auto mb-4 relative w-24 h-24"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          >
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/20"
              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            <img
              src={getAvatarForLevel(level.level_number)}
              alt={level.name}
              className="w-24 h-24 rounded-full border-4 border-primary object-cover relative z-10"
            />
            <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1.5 z-20 shadow-lg">
              <Trophy className="h-4 w-4" />
            </div>
          </motion.div>

          <motion.p
            className="text-primary font-bold text-xs uppercase tracking-widest mb-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Novo nível desbloqueado!
          </motion.p>

          <motion.h2
            className="font-display text-2xl font-bold text-foreground mb-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Nível {level.level_number}
          </motion.h2>

          <motion.p
            className="text-lg font-semibold text-primary mb-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {level.name}
          </motion.p>

          <motion.p
            className="text-muted-foreground text-sm mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Parabéns! Você alcançou um novo nível. Continue evoluindo!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button onClick={onClose} className="w-full">
              Continuar jornada
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LevelUpCelebration;

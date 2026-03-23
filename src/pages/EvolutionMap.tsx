import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLevels, getLevelFromList, getLevelProgressFromList } from "@/hooks/useLevels";
import { getAvatarForLevel } from "@/lib/levels";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Lock, CheckCircle2, Zap, Monitor, Coffee,
  Briefcase, Award, Building2, Armchair, Laptop, Presentation,
  BookOpen, Trophy, Rocket, Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const officeIcons = [
  Coffee, Monitor, BookOpen, Laptop, Briefcase,
  Armchair, Presentation, Building2, Award, Trophy,
  Rocket, Crown, Briefcase, Award,
];

const EvolutionMap = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { levels, loading } = useLevels();
  const [xp, setXp] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState<null | typeof levels[0]>(null);
  const [selectedReached, setSelectedReached] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("xp")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => setXp(data?.xp ?? 0));
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <motion.div
            className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          />
          <p className="text-muted-foreground text-sm">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  const currentLevel = getLevelFromList(levels, xp);
  const progress = getLevelProgressFromList(levels, xp);

  const handleNodeClick = (level: typeof levels[0], isReached: boolean) => {
    setSelectedLevel(level);
    setSelectedReached(isReached);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="container flex items-center justify-between h-14 px-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <h1 className="font-display font-bold text-sm">Mapa de Evolução</h1>
          <div className="flex items-center gap-1 text-sm font-bold text-xp">
            <Zap className="h-4 w-4" /> {xp} XP
          </div>
        </div>
      </header>

      <main className="container px-4 py-8 max-w-lg mx-auto">
        {/* Hero */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl sm:text-3xl font-display font-bold">Sua Evolução</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Do estagiário ao especialista — cada passo conta
          </p>
        </motion.div>

        {/* Current level summary */}
        <motion.div
          className="glass-card p-4 mb-8 flex items-center gap-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative shrink-0">
            <img
              src={getAvatarForLevel(currentLevel.level_number)}
              alt={currentLevel.name}
              className="w-12 h-12 rounded-full border-2 border-primary object-cover"
            />
            <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {currentLevel.level_number}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-sm truncate">{currentLevel.name}</p>
            <div className="h-2 bg-muted rounded-full overflow-hidden mt-1.5">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Continue evoluindo para desbloquear o próximo nível
            </p>
          </div>
        </motion.div>

        {/* Map trail */}
        <div className="relative flex flex-col items-center">
          {levels.map((level, i) => {
            const isReached = xp >= level.min_xp;
            const isCurrent = level.level_number === currentLevel.level_number;
            const avatar = getAvatarForLevel(level.level_number);
            const OfficeIcon = officeIcons[i % officeIcons.length];
            // Alternate left/right offset for the "path" feel
            const offsetClass = i % 2 === 0 ? "-translate-x-10 sm:-translate-x-16" : "translate-x-10 sm:translate-x-16";

            return (
              <div key={level.id} className="relative flex flex-col items-center">
                {/* Connector line */}
                {i > 0 && (
                  <div
                    className={cn(
                      "w-0.5 h-8",
                      isReached ? "bg-primary/40" : "bg-border"
                    )}
                  />
                )}

                {/* Node */}
                <motion.button
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleNodeClick(level, isReached)}
                  className={cn(
                    "relative flex flex-col items-center transition-transform focus:outline-none",
                    offsetClass
                  )}
                >
                  {/* Circle */}
                  <div
                    className={cn(
                      "w-16 h-16 sm:w-20 sm:h-20 rounded-full border-[3px] flex items-center justify-center transition-all cursor-pointer",
                      isCurrent
                        ? "border-primary bg-primary/15 ring-4 ring-primary/25 shadow-lg shadow-primary/20"
                        : isReached
                        ? "border-primary/50 bg-primary/10"
                        : "border-muted bg-muted/40"
                    )}
                  >
                    {isCurrent ? (
                      <motion.img
                        src={avatar}
                        alt={level.name}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                        animate={{ scale: [1, 1.06, 1] }}
                        transition={{ repeat: Infinity, duration: 2.5 }}
                      />
                    ) : isReached ? (
                      <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                    ) : (
                      <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground/50" />
                    )}
                  </div>

                  {/* Label */}
                  <div className="mt-1.5 flex flex-col items-center max-w-[120px] sm:max-w-[150px]">
                    <div className="flex items-center gap-1">
                      <OfficeIcon
                        className={cn(
                          "h-3 w-3 shrink-0",
                          isCurrent ? "text-primary" : isReached ? "text-primary/60" : "text-muted-foreground/40"
                        )}
                      />
                      <span
                        className={cn(
                          "text-[10px] sm:text-xs font-bold",
                          isCurrent ? "text-primary" : isReached ? "text-foreground/70" : "text-muted-foreground/40"
                        )}
                      >
                        Nível {level.level_number}
                      </span>
                    </div>
                    {isReached && (
                      <motion.span
                        className={cn(
                          "text-[10px] sm:text-[11px] text-center leading-tight truncate w-full",
                          isCurrent ? "font-bold text-foreground" : "text-foreground/60"
                        )}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        {level.name}
                      </motion.span>
                    )}
                  </div>
                </motion.button>
              </div>
            );
          })}
        </div>
      </main>

      {/* Detail dialog */}
      <Dialog open={!!selectedLevel} onOpenChange={() => setSelectedLevel(null)}>
        <DialogContent className="max-w-sm">
          {selectedLevel && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-display">
                  {selectedReached ? (
                    <>
                      <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </div>
                      Nível {selectedLevel.level_number} — {selectedLevel.name}
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      Nível {selectedLevel.level_number}
                    </>
                  )}
                </DialogTitle>
                <DialogDescription className="pt-2">
                  {selectedReached ? (
                    <span className="text-foreground/80">{selectedLevel.description}</span>
                  ) : (
                    <span className="italic">
                      🔒 Conquista bloqueada. Continue evoluindo para desbloquear.
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>
              {selectedReached && (
                <p className="text-xs text-muted-foreground">
                  Requisito: {selectedLevel.min_xp} XP
                </p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EvolutionMap;

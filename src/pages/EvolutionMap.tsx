import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLevels, getLevelFromList, getLevelProgressFromList } from "@/hooks/useLevels";
import { getAvatarForLevel } from "@/lib/levels";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, CheckCircle2, Zap, Monitor, Coffee, Briefcase, Award, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const officeIcons = [
  Coffee, Monitor, Briefcase, Building2, Award,
  Coffee, Monitor, Briefcase, Building2, Award,
  Coffee, Monitor, Briefcase, Building2,
];

const officeColors = [
  "from-muted to-muted/60",
  "from-primary/20 to-primary/10",
  "from-accent/20 to-accent/10",
  "from-primary/30 to-accent/20",
  "from-accent/30 to-primary/20",
];

const EvolutionMap = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { levels, loading } = useLevels();
  const [xp, setXp] = useState(0);

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
        <p className="text-muted-foreground">Carregando mapa...</p>
      </div>
    );
  }

  const currentLevel = getLevelFromList(levels, xp);
  const progress = getLevelProgressFromList(levels, xp);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
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

      <main className="container px-4 py-8 max-w-3xl mx-auto">
        {/* Hero */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-3xl font-display font-bold">Sua Evolução Profissional</h2>
          <p className="text-muted-foreground mt-1">Do estagiário ao especialista — cada passo conta</p>
        </motion.div>

        {/* Progress summary */}
        <motion.div
          className="glass-card p-4 mb-10 flex items-center gap-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative">
            <img
              src={getAvatarForLevel(currentLevel.level_number)}
              alt={currentLevel.name}
              className="w-14 h-14 rounded-full border-2 border-primary object-cover"
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

        {/* Map path */}
        <div className="relative">
          {levels.map((level, i) => {
            const isReached = xp >= level.min_xp;
            const isCurrent = level.level_number === currentLevel.level_number;
            const avatar = getAvatarForLevel(level.level_number);
            const isEven = i % 2 === 0;
            const OfficeIcon = officeIcons[i % officeIcons.length];
            const colorGradient = officeColors[i % officeColors.length];

            return (
              <motion.div
                key={level.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="relative"
              >
                {/* Connector line */}
                {i < levels.length - 1 && (
                  <div
                    className={cn(
                      "absolute w-0.5 left-1/2 -translate-x-1/2",
                      isReached ? "bg-primary/40" : "bg-border"
                    )}
                    style={{ top: "100%", height: "2rem" }}
                  />
                )}

                {/* Node */}
                <div
                  className={cn(
                    "flex items-center gap-4 mb-8",
                    isEven ? "flex-row" : "flex-row-reverse"
                  )}
                >
                  {/* Office scene card */}
                  <div
                    className={cn(
                      "flex-1 rounded-2xl border p-4 transition-all relative overflow-hidden",
                      isCurrent
                        ? "border-primary/40 bg-card shadow-lg shadow-primary/10"
                        : isReached
                        ? "border-border bg-card/80"
                        : "border-muted bg-muted/30"
                    )}
                  >
                    {/* Background gradient accent */}
                    <div
                      className={cn(
                        "absolute inset-0 bg-gradient-to-br opacity-30 pointer-events-none",
                        isReached ? colorGradient : "from-muted/20 to-muted/10"
                      )}
                    />

                    <div className="relative z-[1]">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                            isCurrent
                              ? "bg-primary/20"
                              : isReached
                              ? "bg-primary/10"
                              : "bg-muted"
                          )}
                        >
                          {isReached ? (
                            <OfficeIcon
                              className={cn(
                                "h-4 w-4",
                                isCurrent ? "text-primary" : "text-primary/70"
                              )}
                            />
                          ) : (
                            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          {isReached ? (
                            <h3 className="font-display font-bold text-sm truncate">
                              {level.name}
                            </h3>
                          ) : (
                            <h3 className="font-display font-bold text-sm text-muted-foreground truncate">
                              Nível {level.level_number}
                            </h3>
                          )}
                          <p className="text-[10px] text-muted-foreground">
                            {level.min_xp} XP
                          </p>
                        </div>
                      </div>

                      {isReached ? (
                        <p className="text-xs text-foreground/70 leading-relaxed line-clamp-2">
                          {level.description}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          🔒 Conquista bloqueada
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Center node circle */}
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      className={cn(
                        "w-14 h-14 rounded-full border-[3px] flex items-center justify-center transition-all",
                        isCurrent
                          ? "border-primary bg-primary/20 ring-4 ring-primary/20 shadow-lg shadow-primary/20"
                          : isReached
                          ? "border-primary/60 bg-primary/10"
                          : "border-muted bg-muted/40"
                      )}
                    >
                      {isCurrent ? (
                        <motion.img
                          src={avatar}
                          alt={level.name}
                          className="w-9 h-9 rounded-full object-cover"
                          animate={{ scale: [1, 1.08, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        />
                      ) : isReached ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground/60" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-bold mt-1",
                        isCurrent
                          ? "text-primary"
                          : isReached
                          ? "text-primary/60"
                          : "text-muted-foreground/50"
                      )}
                    >
                      {level.level_number}
                    </span>
                  </div>

                  {/* Spacer for alternating layout */}
                  <div className="flex-1" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default EvolutionMap;

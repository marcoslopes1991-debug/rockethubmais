import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLevels, getLevelFromList, getLevelProgressFromList, getNextLevelFromList } from "@/hooks/useLevels";
import { getAvatarForLevel } from "@/lib/levels";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Lock, CheckCircle2, Zap, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Journey = () => {
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
        <p className="text-muted-foreground">Carregando jornada...</p>
      </div>
    );
  }

  const currentLevel = getLevelFromList(levels, xp);
  const nextLevel = getNextLevelFromList(levels, xp);
  const progress = getLevelProgressFromList(levels, xp);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between h-14 px-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <div className="flex items-center gap-1 text-sm font-bold text-xp">
            <Zap className="h-4 w-4" /> {xp} XP
          </div>
        </div>
      </header>

      <main className="container px-4 py-8 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold">Sua Jornada</h1>
          <p className="text-muted-foreground mt-1">Evolua de Usuário a Consultor Especialista</p>
        </div>

        {/* Current level progress */}
        {nextLevel && (
          <Card className="glass-card mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-display font-bold">{currentLevel.name}</span>
                <span className="text-muted-foreground">Continue evoluindo para desbloquear o próximo nível</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Continue evoluindo para desbloquear o próximo nível
              </p>
            </CardContent>
          </Card>
        )}

        {/* Level timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-4">
            {levels.map((level, i) => {
              const isReached = xp >= level.min_xp;
              const isCurrent = level.level_number === currentLevel.level_number;
              const avatar = getAvatarForLevel(level.level_number);

              return (
                <motion.div
                  key={level.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="relative flex items-start gap-4 pl-1">
                    {/* Node */}
                    <div
                      className={cn(
                        "relative z-10 flex items-center justify-center w-11 h-11 rounded-full border-2 shrink-0",
                        isCurrent
                          ? "border-primary bg-primary/20 ring-4 ring-primary/20"
                          : isReached
                          ? "border-primary bg-primary/10"
                          : "border-muted bg-muted/50"
                      )}
                    >
                      {isReached ? (
                        <img src={avatar} alt={level.name} className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>

                    {/* Content */}
                    <Card
                      className={cn(
                        "flex-1 transition-all",
                        isCurrent
                          ? "glass-card border-primary/30 shadow-lg shadow-primary/10"
                          : isReached
                          ? "glass-card"
                          : "bg-muted/20 border-muted"
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isCurrent && <Star className="h-4 w-4 text-accent" />}
                            <h3
                              className={cn(
                                "font-display font-bold text-sm",
                                !isReached && "text-muted-foreground"
                              )}
                            >
                              Nível {level.level_number} — {level.name}
                            </h3>
                          </div>
                          {isReached && !isCurrent && (
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground mt-1">
                          {level.min_xp} XP mínimo
                        </p>

                        {isReached ? (
                          <p className="text-sm mt-2 text-foreground/80">{level.description}</p>
                        ) : (
                          <p className="text-sm mt-2 text-muted-foreground italic">
                            🔒 Conquista bloqueada
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Journey;

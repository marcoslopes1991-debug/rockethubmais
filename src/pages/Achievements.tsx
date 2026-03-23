import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAchievements } from "@/hooks/useAchievements";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const categoryLabels: Record<string, string> = {
  streak: "🔥 Streak",
  xp: "⭐ XP",
  correct_answers: "🎯 Acertos",
  geral: "🏆 Geral",
};

const Achievements = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { achievements, loading, isUnlocked } = useAchievements();

  if (!user) {
    navigate("/auth");
    return null;
  }

  // Group by category
  const grouped = achievements.reduce<Record<string, typeof achievements>>((acc, ach) => {
    const cat = ach.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ach);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="container flex items-center justify-between h-14 px-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <h1 className="font-display font-bold text-sm">Conquistas</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="container px-4 py-8 max-w-lg mx-auto space-y-8">
        <motion.div className="text-center" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-2xl font-display font-bold">Suas Conquistas</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {achievements.filter((a) => isUnlocked(a.id)).length} de {achievements.length} desbloqueadas
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-12">
            <motion.div
              className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            />
          </div>
        ) : (
          Object.entries(grouped).map(([cat, achs]) => (
            <div key={cat} className="space-y-3">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                {categoryLabels[cat] ?? cat}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {achs.map((ach, i) => {
                  const unlocked = isUnlocked(ach.id);
                  return (
                    <motion.div
                      key={ach.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card
                        className={cn(
                          "transition-all",
                          unlocked
                            ? "glass-card border-primary/30"
                            : "bg-muted/30 border-border/30 opacity-60"
                        )}
                      >
                        <CardContent className="pt-5 pb-4 text-center space-y-1">
                          <div className="text-3xl mb-1">
                            {unlocked ? ach.icon_emoji : <Lock className="h-6 w-6 mx-auto text-muted-foreground/40" />}
                          </div>
                          <p
                            className={cn(
                              "text-sm font-bold",
                              unlocked ? "text-foreground" : "text-muted-foreground/50"
                            )}
                          >
                            {unlocked ? ach.name : "???"}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {unlocked ? ach.description : "Conquista bloqueada"}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default Achievements;

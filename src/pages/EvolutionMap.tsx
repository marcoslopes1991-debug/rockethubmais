import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLevels, getLevelFromList, getLevelProgressFromList } from "@/hooks/useLevels";
import { getAvatarForLevel } from "@/lib/levels";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Zap, Coffee, Monitor, Briefcase, Award, Building2,
  Armchair, Laptop, Presentation, BookOpen, Trophy, Rocket, Crown,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import OfficeBackground from "@/components/evolution-map/OfficeBackground";
import MapNode from "@/components/evolution-map/MapNode";
import LevelDetailDialog from "@/components/evolution-map/LevelDetailDialog";
import type { DbLevel } from "@/hooks/useLevels";

const officeIcons = [
  Coffee, Monitor, BookOpen, Laptop, Briefcase,
  Armchair, Presentation, Building2, Award, Trophy,
  Rocket, Crown, Briefcase, Award,
];

/** Map level_number to office stage: 0 = starter, 1 = pro, 2 = executive */
function getOfficeStage(levelNumber: number): number {
  if (levelNumber <= 4) return 0;
  if (levelNumber <= 10) return 1;
  return 2;
}

const EvolutionMap = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { levels, loading } = useLevels();
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState<DbLevel | null>(null);
  const [selectedReached, setSelectedReached] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("xp, streak_count")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        setXp(data?.xp ?? 0);
        setStreak(data?.streak_count ?? 0);
      });
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
  const officeStage = getOfficeStage(currentLevel.level_number);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Evolving office background */}
      <OfficeBackground stageIndex={officeStage} />

      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20">
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

      <main className="container px-4 py-8 max-w-lg mx-auto relative z-10">
        {/* Hero */}
        <motion.div className="text-center mb-6" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
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

            return (
              <MapNode
                key={level.id}
                level={level}
                index={i}
                isReached={isReached}
                isCurrent={isCurrent}
                OfficeIcon={officeIcons[i % officeIcons.length]}
                onClick={() => {
                  setSelectedLevel(level);
                  setSelectedReached(isReached);
                }}
              />
            );
          })}
        </div>
      </main>

      {/* Detail dialog */}
      <LevelDetailDialog
        level={selectedLevel}
        reached={selectedReached}
        onClose={() => setSelectedLevel(null)}
      />
    </div>
  );
};

export default EvolutionMap;

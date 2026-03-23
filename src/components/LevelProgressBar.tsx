import { getLevelInfo, getLevelProgress, getNextLevel } from "@/lib/levels";
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";

interface LevelProgressBarProps {
  xp: number;
  className?: string;
}

const LevelProgressBar = ({ xp, className }: LevelProgressBarProps) => {
  const current = getLevelInfo(xp);
  const next = getNextLevel(xp);
  const progress = getLevelProgress(xp);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-display font-bold text-foreground">{current.name}</span>
        {next && (
          <span className="text-muted-foreground">
            Próximo: {next.name} ({next.minXp} XP)
          </span>
        )}
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Zap className="h-3 w-3 text-xp" /> {xp} XP
        </span>
        {next ? (
          <span>{next.minXp - xp} XP para o próximo nível</span>
        ) : (
          <span className="text-primary font-bold">Nível máximo! 🏆</span>
        )}
      </div>
    </div>
  );
};

export default LevelProgressBar;

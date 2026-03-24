import { useLevels, getLevelFromList, getLevelProgressFromList, getNextLevelFromList } from "@/hooks/useLevels";
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";

interface LevelProgressBarProps {
  xp: number;
  className?: string;
}

const LevelProgressBar = ({ xp, className }: LevelProgressBarProps) => {
  const { levels } = useLevels();

  if (levels.length === 0) return null;

  const current = getLevelFromList(levels, xp);
  const next = getNextLevelFromList(levels, xp);
  const progress = getLevelProgressFromList(levels, xp);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-display font-bold text-foreground">{current.name}</span>
        {next && (
          <span className="text-xs text-muted-foreground font-medium">
            {xp} / {next.min_xp} XP
          </span>
        )}
        {!next && (
          <span className="text-xs text-primary font-bold">Nível máximo! 🏆</span>
        )}
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default LevelProgressBar;

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakBadgeProps {
  streak: number;
  className?: string;
}

const StreakBadge = ({ streak, className }: StreakBadgeProps) => {
  const isActive = streak > 0;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all",
        isActive
          ? "bg-accent/15 text-accent border border-accent/30"
          : "bg-muted text-muted-foreground border border-border",
        className
      )}
    >
      <Flame className={cn("h-4 w-4", isActive && "animate-xp-pop")} />
      <span>{streak}</span>
      <span className="text-xs font-normal">
        {streak === 1 ? "dia" : "dias"}
      </span>
    </div>
  );
};

export default StreakBadge;

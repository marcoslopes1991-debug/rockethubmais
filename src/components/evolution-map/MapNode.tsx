import { motion } from "framer-motion";
import { CheckCircle2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAvatarForLevel } from "@/lib/levels";
import type { DbLevel } from "@/hooks/useLevels";
import type { LucideIcon } from "lucide-react";

interface MapNodeProps {
  level: DbLevel;
  index: number;
  isReached: boolean;
  isCurrent: boolean;
  OfficeIcon: LucideIcon;
  onClick: () => void;
}

const MapNode = ({ level, index, isReached, isCurrent, OfficeIcon, onClick }: MapNodeProps) => {
  const offsetClass = index % 2 === 0 ? "-translate-x-10 sm:-translate-x-16" : "translate-x-10 sm:translate-x-16";
  const avatar = getAvatarForLevel(level.level_number);

  return (
    <div className="relative flex flex-col items-center">
      {/* Connector */}
      {index > 0 && (
        <div className={cn("w-0.5 h-8", isReached ? "bg-primary/40" : "bg-border")} />
      )}

      <motion.button
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={onClick}
        className={cn("relative flex flex-col items-center transition-transform focus:outline-none", offsetClass)}
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
};

export default MapNode;

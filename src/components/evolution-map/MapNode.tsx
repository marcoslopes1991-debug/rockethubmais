import { motion } from "framer-motion";
import { CheckCircle2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getGenderedAvatar } from "@/lib/levels";
import type { DbLevel } from "@/hooks/useLevels";
import type { LucideIcon } from "lucide-react";

interface MapNodeProps {
  level: DbLevel;
  index: number;
  isReached: boolean;
  isCurrent: boolean;
  OfficeIcon: LucideIcon;
  gender: string | null;
  onClick: () => void;
}

const MapNode = ({ level, index, isReached, isCurrent, OfficeIcon, gender, onClick }: MapNodeProps) => {
  const avatar = getGenderedAvatar(level, gender);
  const isLeft = index % 2 === 0;

  return (
    <div className="relative w-full" style={{ minHeight: "100px" }}>
      {/* SVG curved connector to previous node */}
      {index > 0 && (
        <svg
          className="absolute top-0 left-0 w-full pointer-events-none"
          style={{ height: "40px", marginTop: "-40px" }}
          viewBox="0 0 400 40"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d={
              isLeft
                ? "M 300 0 C 300 20, 100 20, 100 40"
                : "M 100 0 C 100 20, 300 20, 300 40"
            }
            stroke={isReached ? "hsl(var(--primary) / 0.4)" : "hsl(var(--border))"}
            strokeWidth="3"
            strokeDasharray={isReached ? "none" : "6 4"}
            fill="none"
          />
        </svg>
      )}

      {/* Node positioned left or right */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06, duration: 0.4 }}
        onClick={onClick}
        className={cn(
          "relative flex items-center gap-4 transition-transform focus:outline-none group",
          isLeft ? "mr-auto ml-4 sm:ml-12 flex-row" : "ml-auto mr-4 sm:mr-12 flex-row-reverse"
        )}
      >
        {/* Circle */}
        <div className="relative shrink-0">
          <div
            className={cn(
              "relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-[3px] flex items-center justify-center transition-all cursor-pointer overflow-hidden",
              isCurrent
                ? "border-primary bg-primary/15 ring-4 ring-primary/25 shadow-lg shadow-primary/20"
                : isReached
                ? "border-primary/50 bg-primary/10"
                : "border-muted bg-muted/40"
            )}
          >
            {isCurrent && (
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/10"
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              />
            )}

            {isCurrent ? (
              <motion.img
                src={avatar}
                alt={level.name}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover relative z-10"
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
              />
            ) : isReached ? (
              <img
                src={avatar}
                alt={level.name}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover opacity-90"
              />
            ) : (
              <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground/50" />
            )}

            {/* Green check badge */}
            {isReached && !isCurrent && (
              <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 text-white rounded-full p-0.5 shadow-md z-10">
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
            )}
          </div>
        </div>

        {/* Label card */}
        <div
          className={cn(
            "flex flex-col gap-0.5 p-2.5 rounded-xl transition-all max-w-[160px] sm:max-w-[200px]",
            isCurrent
              ? "bg-primary/10 border border-primary/30 shadow-sm"
              : isReached
              ? "bg-card/60 border border-border/50"
              : "bg-muted/20 border border-transparent"
          )}
        >
          <div className="flex items-center gap-1.5">
            <OfficeIcon
              className={cn(
                "h-3.5 w-3.5 shrink-0",
                isCurrent ? "text-primary" : isReached ? "text-primary/60" : "text-muted-foreground/40"
              )}
            />
            <span
              className={cn(
                "text-xs font-bold",
                isCurrent ? "text-primary" : isReached ? "text-foreground/70" : "text-muted-foreground/40"
              )}
            >
              Nível {level.level_number}
            </span>
          </div>
          {isReached && (
            <motion.span
              className={cn(
                "text-[11px] sm:text-xs leading-tight",
                isCurrent ? "font-bold text-foreground" : "text-foreground/60"
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {level.name}
            </motion.span>
          )}
          {isCurrent && (
            <motion.span
              className="text-[10px] sm:text-xs font-bold text-primary mt-1 flex items-center gap-1"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              ▶ Continuar jornada
            </motion.span>
          )}
          {!isReached && (
            <span className="text-[10px] text-muted-foreground/40 italic">
              Bloqueado
            </span>
          )}
        </div>
      </motion.button>

      {/* Decorative office element scattered along the path */}
      {index % 3 === 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none hidden sm:block",
            isLeft ? "right-8 sm:right-20" : "left-8 sm:left-20"
          )}
        >
          <OfficeIcon className="h-8 w-8 sm:h-10 sm:w-10" />
        </motion.div>
      )}
    </div>
  );
};

export default MapNode;

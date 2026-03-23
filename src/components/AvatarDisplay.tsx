import { cn } from "@/lib/utils";
import { getLevelInfo } from "@/lib/levels";

interface AvatarDisplayProps {
  xp: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-16 w-16",
  md: "h-24 w-24",
  lg: "h-32 w-32",
};

const AvatarDisplay = ({ xp, size = "md", className }: AvatarDisplayProps) => {
  const level = getLevelInfo(xp);

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border-4 border-primary/30 overflow-hidden flex items-center justify-center",
          sizeClasses[size]
        )}
      >
        <img
          src={level.avatar}
          alt={level.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
        Nv. {level.level}
      </div>
    </div>
  );
};

export default AvatarDisplay;

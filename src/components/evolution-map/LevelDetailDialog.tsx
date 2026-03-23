import { CheckCircle2, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { DbLevel } from "@/hooks/useLevels";

interface LevelDetailDialogProps {
  level: DbLevel | null;
  reached: boolean;
  onClose: () => void;
}

const LevelDetailDialog = ({ level, reached, onClose }: LevelDetailDialogProps) => (
  <Dialog open={!!level} onOpenChange={() => onClose()}>
    <DialogContent className="max-w-sm">
      {level && (
        <>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              {reached ? (
                <>
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  Nível {level.level_number} — {level.name}
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  Nível {level.level_number}
                </>
              )}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {reached ? (
                <span className="text-foreground/80">{level.description}</span>
              ) : (
                <span className="italic">
                  🔒 Conquista bloqueada. Continue evoluindo para desbloquear.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {reached && (
            <p className="text-xs text-muted-foreground">Requisito: {level.min_xp} XP</p>
          )}
        </>
      )}
    </DialogContent>
  </Dialog>
);

export default LevelDetailDialog;

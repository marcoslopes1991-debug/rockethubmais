import { Card, CardContent } from "@/components/ui/card";
import { Target } from "lucide-react";

interface ActionCardProps {
  hasStarted: boolean;
  hasUnanswered: boolean;
}

const ActionCard = ({ hasStarted, hasUnanswered }: ActionCardProps) => {
  if (!hasUnanswered) return null;

  const title = hasStarted ? "Continuar jornada" : "Começar missão";

  return (
    <Card className="glass-card border-primary/30 bg-gradient-to-br from-primary/10 to-transparent overflow-hidden">
      <CardContent className="pt-6 pb-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/20">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-display font-bold">{title}</h2>
            <p className="text-sm text-muted-foreground">Continue evoluindo e suba de nível</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActionCard;

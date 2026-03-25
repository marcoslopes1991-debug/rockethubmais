import { DbLevel } from "@/hooks/useLevels";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";

interface Props {
  levels: DbLevel[];
  loading: boolean;
}

const LevelReferencePanel = ({ levels, loading }: Props) => {
  if (loading) return null;

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Info className="h-4 w-4 text-primary" />
        Referência de Níveis (use <code className="text-xs bg-muted px-1 rounded">nivel_id</code> ou <code className="text-xs bg-muted px-1 rounded">nivel</code>)
      </div>
      <div className="flex flex-wrap gap-2">
        {levels.map((l) => (
          <Badge key={l.id} variant="outline" className="text-xs font-mono gap-1">
            <span className="text-primary font-bold">{l.level_number}</span>
            <span className="text-muted-foreground">—</span>
            {l.name}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default LevelReferencePanel;

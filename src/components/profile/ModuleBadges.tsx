import { Badge } from "@/components/ui/badge";

interface ModuleBadgesProps {
  modules: string[];
}

const ModuleBadges = ({ modules }: ModuleBadgesProps) => {
  if (!modules || modules.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 justify-center">
      {modules.map((mod) => (
        <Badge key={mod} variant="secondary" className="text-xs px-2.5 py-0.5">
          {mod}
        </Badge>
      ))}
    </div>
  );
};

export default ModuleBadges;

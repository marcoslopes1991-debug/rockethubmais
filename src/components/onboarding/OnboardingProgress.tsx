import { Progress } from "@/components/ui/progress";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export default function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  const pct = (currentStep / totalSteps) * 100;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Etapa {currentStep} de {totalSteps}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
}

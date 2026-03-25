import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { PartyPopper, Rocket } from "lucide-react";

interface OnboardingStep3Props {
  displayName: string;
  onFinish: () => void;
}

export default function OnboardingStep3({ displayName, onFinish }: OnboardingStep3Props) {
  const [message, setMessage] = useState(
    "Parabéns! Você concluiu seu cadastro. Estamos felizes em ter você aqui. Prepare-se para uma jornada incrível de aprendizado!"
  );

  useEffect(() => {
    supabase
      .from("ai_config")
      .select("welcome_message")
      .limit(1)
      .single()
      .then(({ data }: any) => {
        if (data?.welcome_message) setMessage(data.welcome_message);
      });
  }, []);

  return (
    <div className="flex flex-col items-center text-center space-y-8 py-6">
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center animate-xp-pop">
          <PartyPopper className="h-12 w-12 text-primary" />
        </div>
        <span className="absolute -top-1 -right-1 text-2xl animate-bounce">🎉</span>
      </div>

      <div className="space-y-3">
        <h2 className="text-2xl font-display font-bold">
          Seja bem-vindo{displayName ? `, ${displayName.split(" ")[0]}` : ""}!
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto whitespace-pre-line">
          {message}
        </p>
      </div>

      <Button size="lg" className="w-full gap-2" onClick={onFinish}>
        <Rocket className="h-4 w-4" />
        Começar jornada
      </Button>
    </div>
  );
}

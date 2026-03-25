import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";

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
    <div className="flex flex-col items-center text-center space-y-6 py-4">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
        <Sparkles className="h-10 w-10 text-primary" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-display font-bold">
          Bem-vindo{displayName ? `, ${displayName.split(" ")[0]}` : ""}! 🎉
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto whitespace-pre-line">
          {message}
        </p>
      </div>

      <Button size="lg" className="w-full" onClick={onFinish}>
        Começar a jornada
      </Button>
    </div>
  );
}

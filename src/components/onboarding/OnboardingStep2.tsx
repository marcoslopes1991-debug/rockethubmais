import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface OnboardingStep2Props {
  trabalhaSap: boolean | null;
  setTrabalhaSap: (v: boolean) => void;
  perfilSap: string;
  setPerfilSap: (v: string) => void;
  tempoSap: string;
  setTempoSap: (v: string) => void;
  cursosRockethub: string[];
  setCursosRockethub: (v: string[]) => void;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
}

const tempoOptions = [
  "Menos de 6 meses",
  "De 6 meses a 1 ano",
  "De 1 a 2 anos",
  "De 2 a 5 anos",
  "Mais de 5 anos",
];

export default function OnboardingStep2({
  trabalhaSap, setTrabalhaSap,
  perfilSap, setPerfilSap,
  tempoSap, setTempoSap,
  cursosRockethub, setCursosRockethub,
  onNext, onBack, loading,
}: OnboardingStep2Props) {
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    supabase
      .from("onboarding_courses")
      .select("id, name")
      .eq("active", true)
      .then(({ data }) => {
        if (data) setCourses(data);
      });
  }, []);

  const toggleCourse = (id: string) => {
    setCursosRockethub(
      cursosRockethub.includes(id)
        ? cursosRockethub.filter((c) => c !== id)
        : [...cursosRockethub, id]
    );
  };

  const canProceed =
    trabalhaSap !== null &&
    (trabalhaSap
      ? perfilSap !== "" && tempoSap !== ""
      : true);

  const RadioOption = ({
    selected,
    label,
    onClick,
  }: {
    selected: boolean;
    label: string;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-lg border-2 p-3 text-sm font-medium transition-all ${
        selected
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background text-muted-foreground hover:border-primary/50"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-5">
      {/* Main question */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Você trabalha atualmente com SAP?</Label>
        <div className="grid grid-cols-2 gap-3">
          <RadioOption selected={trabalhaSap === true} label="Sim" onClick={() => setTrabalhaSap(true)} />
          <RadioOption selected={trabalhaSap === false} label="Não" onClick={() => setTrabalhaSap(false)} />
        </div>
      </div>

      {/* YES branch */}
      {trabalhaSap === true && (
        <>
          <div className="space-y-3">
            <Label className="text-base font-semibold">Você é usuário ou consultor?</Label>
            <div className="grid grid-cols-2 gap-3">
              <RadioOption selected={perfilSap === "usuario"} label="Usuário" onClick={() => setPerfilSap("usuario")} />
              <RadioOption selected={perfilSap === "consultor"} label="Consultor" onClick={() => setPerfilSap("consultor")} />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Trabalha há quanto tempo com SAP?</Label>
            <div className="space-y-2">
              {tempoOptions.map((opt) => (
                <RadioOption key={opt} selected={tempoSap === opt} label={opt} onClick={() => setTempoSap(opt)} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* NO branch */}
      {trabalhaSap === false && courses.length > 0 && (
        <div className="space-y-3">
          <Label className="text-base font-semibold">Você já fez algum curso da RocketHub?</Label>
          <div className="flex flex-wrap gap-2">
            {courses.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCourse(c.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium border-2 transition-all ${
                  cursosRockethub.includes(c.id)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" size="lg" onClick={onBack}>
          Voltar
        </Button>
        <Button type="button" className="flex-1" size="lg" disabled={!canProceed || loading} onClick={onNext}>
          {loading ? "Salvando..." : "Continuar"}
        </Button>
      </div>
    </div>
  );
}

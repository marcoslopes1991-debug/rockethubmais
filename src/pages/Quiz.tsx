import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Check, X, Zap, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string;
  xp_reward: number;
}

type OptionKey = "a" | "b" | "c" | "d";

const Quiz = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<OptionKey | null>(null);
  const [answered, setAnswered] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchQuestions = async () => {
      const { data: answeredIds } = await supabase
        .from("answers")
        .select("question_id")
        .eq("user_id", user.id);

      const answeredSet = new Set(answeredIds?.map((a) => a.question_id) ?? []);

      const { data: allQuestions } = await supabase.from("questions").select("*");

      const unanswered = (allQuestions ?? []).filter((q) => !answeredSet.has(q.id));
      setQuestions(unanswered);
      setLoading(false);
    };

    fetchQuestions();
  }, [user]);

  const currentQuestion = questions[currentIndex];

  const handleSelect = async (option: OptionKey) => {
    if (answered || !user || !currentQuestion) return;
    setSelected(option);
    setAnswered(true);

    const isCorrect = option === currentQuestion.correct_option;

    await supabase.from("answers").insert({
      user_id: user.id,
      question_id: currentQuestion.id,
      selected_option: option,
      is_correct: isCorrect,
    });

    if (isCorrect) {
      setXpGained((prev) => prev + currentQuestion.xp_reward);
      // Update XP
      const { data: profile } = await supabase
        .from("profiles")
        .select("xp")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        await supabase
          .from("profiles")
          .update({ xp: profile.xp + currentQuestion.xp_reward })
          .eq("user_id", user.id);
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      navigate("/");
    }
  };

  const getOptionStyle = (key: OptionKey) => {
    if (!answered) {
      return selected === key
        ? "border-primary bg-primary/5"
        : "border-border hover:border-primary/50 hover:bg-primary/5";
    }
    if (key === currentQuestion?.correct_option) return "border-success bg-success/10";
    if (key === selected && key !== currentQuestion?.correct_option)
      return "border-destructive bg-destructive/10";
    return "border-border opacity-50";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="glass-card max-w-md w-full text-center p-8">
          <h2 className="text-xl font-display font-bold mb-2">Nenhuma missão disponível</h2>
          <p className="text-muted-foreground mb-4">Você já respondeu todas as perguntas!</p>
          <Button onClick={() => navigate("/")}>Voltar ao Dashboard</Button>
        </Card>
      </div>
    );
  }

  const options: { key: OptionKey; label: string; value: string }[] = [
    { key: "a", label: "A", value: currentQuestion.option_a },
    { key: "b", label: "B", value: currentQuestion.option_b },
    { key: "c", label: "C", value: currentQuestion.option_c },
    { key: "d", label: "D", value: currentQuestion.option_d },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between h-14 px-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="text-muted-foreground">
              {currentIndex + 1}/{questions.length}
            </span>
            {xpGained > 0 && (
              <span className="flex items-center gap-1 text-xp animate-xp-pop">
                <Zap className="h-4 w-4" /> +{xpGained}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <main className="container px-4 py-8 max-w-2xl mx-auto">
        <Card className="glass-card animate-slide-up">
          <CardHeader>
            <CardTitle className="text-xl font-display leading-relaxed">
              {currentQuestion.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {options.map((opt) => (
              <button
                key={opt.key}
                onClick={() => handleSelect(opt.key)}
                disabled={answered}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-lg border-2 text-left transition-all duration-200",
                  getOptionStyle(opt.key)
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
                    answered && opt.key === currentQuestion.correct_option
                      ? "bg-success text-success-foreground"
                      : answered && opt.key === selected
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {answered && opt.key === currentQuestion.correct_option ? (
                    <Check className="h-4 w-4" />
                  ) : answered && opt.key === selected ? (
                    <X className="h-4 w-4" />
                  ) : (
                    opt.label
                  )}
                </span>
                <span className="font-medium">{opt.value}</span>
              </button>
            ))}

            {answered && (
              <div className="mt-4 space-y-4 animate-slide-up">
                <div
                  className={cn(
                    "p-4 rounded-lg",
                    selected === currentQuestion.correct_option
                      ? "bg-success/10 border border-success/30"
                      : "bg-destructive/10 border border-destructive/30"
                  )}
                >
                  <p className="font-display font-bold mb-1">
                    {selected === currentQuestion.correct_option
                      ? `✅ Correto! +${currentQuestion.xp_reward} XP`
                      : "❌ Errado!"}
                  </p>
                  <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
                </div>
                <Button onClick={handleNext} className="w-full" size="lg">
                  {currentIndex < questions.length - 1 ? (
                    <>
                      Próxima <ArrowRight className="h-4 w-4 ml-1" />
                    </>
                  ) : (
                    "Finalizar"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Quiz;

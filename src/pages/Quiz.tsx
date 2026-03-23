import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAchievements } from "@/hooks/useAchievements";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Check, X, Zap, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

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
  const { checkAndUnlock } = useAchievements();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<OptionKey | null>(null);
  const [answered, setAnswered] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showXpBurst, setShowXpBurst] = useState(false);
  const [streak, setStreak] = useState(0);

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

  const updateStreak = async () => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const { data: profile } = await supabase
      .from("profiles")
      .select("streak_count, last_activity_date")
      .eq("user_id", user.id)
      .single();
    if (!profile) return;
    const lastDate = profile.last_activity_date;
    if (lastDate === today) return;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    const newStreak = lastDate === yesterdayStr ? profile.streak_count + 1 : 1;
    await supabase
      .from("profiles")
      .update({ streak_count: newStreak, last_activity_date: today })
      .eq("user_id", user.id);
  };

  const fireConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ["#22c55e", "#f59e0b", "#3b82f6"],
    });
  };

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

    await updateStreak();

    if (isCorrect) {
      setStreak((s) => s + 1);
      setXpGained((prev) => prev + currentQuestion.xp_reward);
      setShowXpBurst(true);
      setTimeout(() => setShowXpBurst(false), 1200);
      fireConfetti();

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
    } else {
      setStreak(0);
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
        ? "border-primary bg-primary/5 shadow-md"
        : "border-border hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm";
    }
    if (key === currentQuestion?.correct_option) return "border-success bg-success/10 shadow-md";
    if (key === selected && key !== currentQuestion?.correct_option)
      return "border-destructive bg-destructive/10 shadow-md";
    return "border-border opacity-40";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          <Zap className="h-8 w-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring" }}
        >
          <Card className="glass-card max-w-md w-full text-center p-8">
            <h2 className="text-xl font-display font-bold mb-2">Nenhuma missão disponível</h2>
            <p className="text-muted-foreground mb-4">Você já respondeu todas as perguntas!</p>
            <Button onClick={() => navigate("/")}>Voltar ao Dashboard</Button>
          </Card>
        </motion.div>
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
          <div className="flex items-center gap-3 text-sm font-medium">
            {streak >= 2 && (
              <motion.span
                className="text-accent font-display font-bold"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                key={streak}
              >
                🔥 {streak}x combo!
              </motion.span>
            )}
            <span className="text-muted-foreground">
              {currentIndex + 1}/{questions.length}
            </span>
            <AnimatePresence>
              {showXpBurst && (
                <motion.span
                  className="text-xp font-display font-bold text-lg"
                  initial={{ scale: 0, y: 10 }}
                  animate={{ scale: 1.3, y: -10 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  +{currentQuestion.xp_reward} XP
                </motion.span>
              )}
            </AnimatePresence>
            {xpGained > 0 && !showXpBurst && (
              <span className="flex items-center gap-1 text-xp">
                <Zap className="h-4 w-4" /> {xpGained}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="h-1.5 bg-muted">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-accent"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      <main className="container px-4 py-8 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-xl font-display leading-relaxed">
                  {currentQuestion.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {options.map((opt, i) => (
                  <motion.button
                    key={opt.key}
                    onClick={() => handleSelect(opt.key)}
                    disabled={answered}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-lg border-2 text-left transition-colors duration-200",
                      getOptionStyle(opt.key)
                    )}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    whileHover={!answered ? { scale: 1.02 } : {}}
                    whileTap={!answered ? { scale: 0.98 } : {}}
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
                  </motion.button>
                ))}

                <AnimatePresence>
                  {answered && (
                    <motion.div
                      className="mt-4 space-y-4"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                      <motion.div
                        className={cn(
                          "p-4 rounded-lg",
                          selected === currentQuestion.correct_option
                            ? "bg-success/10 border border-success/30"
                            : "bg-destructive/10 border border-destructive/30"
                        )}
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                      >
                        <p className="font-display font-bold mb-1 text-lg">
                          {selected === currentQuestion.correct_option
                            ? `✅ Correto! +${currentQuestion.xp_reward} XP`
                            : "❌ Errado!"}
                        </p>
                        <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button onClick={handleNext} className="w-full" size="lg">
                          {currentIndex < questions.length - 1 ? (
                            <>
                              Próxima <ArrowRight className="h-4 w-4 ml-1" />
                            </>
                          ) : (
                            "🎉 Finalizar"
                          )}
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Quiz;

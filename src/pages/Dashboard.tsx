import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Trophy, Target, LogOut } from "lucide-react";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ display_name: string; xp: number } | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [profileRes, answersRes, questionsRes] = await Promise.all([
        supabase.from("profiles").select("display_name, xp").eq("user_id", user.id).single(),
        supabase.from("answers").select("id").eq("user_id", user.id),
        supabase.from("questions").select("id"),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      setAnsweredCount(answersRes.data?.length ?? 0);
      setTotalQuestions(questionsRes.data?.length ?? 0);
    };

    fetchData();
  }, [user]);

  const hasUnanswered = answeredCount < totalQuestions;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">QuizLearn</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/ranking")}>
              <Trophy className="h-4 w-4 mr-1" /> Ranking
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8 max-w-2xl mx-auto space-y-6">
        <div className="animate-slide-up">
          <h1 className="text-3xl font-display font-bold">
            Olá, {profile?.display_name || "Estudante"} 👋
          </h1>
          <p className="text-muted-foreground mt-1">Continue aprendendo e conquiste mais XP!</p>
        </div>

        <div className="grid grid-cols-2 gap-4 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <Card className="glass-card">
            <CardContent className="pt-6 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-xp/10 mb-2">
                <Zap className="h-6 w-6 text-xp" />
              </div>
              <p className="text-3xl font-display font-bold">{profile?.xp ?? 0}</p>
              <p className="text-sm text-muted-foreground">XP Total</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-2">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <p className="text-3xl font-display font-bold">{answeredCount}/{totalQuestions}</p>
              <p className="text-sm text-muted-foreground">Respondidas</p>
            </CardContent>
          </Card>
        </div>

        <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          {hasUnanswered ? (
            <Button onClick={() => navigate("/quiz")} size="lg" className="w-full text-lg h-14">
              <Target className="h-5 w-5 mr-2" />
              Responder missão do dia
            </Button>
          ) : (
            <Card className="glass-card text-center p-8">
              <Trophy className="h-12 w-12 text-xp mx-auto mb-3" />
              <h2 className="text-xl font-display font-bold">Parabéns!</h2>
              <p className="text-muted-foreground">Você respondeu todas as perguntas disponíveis 🎉</p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

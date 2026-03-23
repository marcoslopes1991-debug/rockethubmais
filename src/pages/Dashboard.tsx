import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Trophy, Target, LogOut, Backpack, Flame } from "lucide-react";
import AvatarDisplay from "@/components/AvatarDisplay";
import LevelProgressBar from "@/components/LevelProgressBar";
import StreakBadge from "@/components/StreakBadge";
import { getLevelInfo } from "@/lib/levels";

interface ProfileData {
  display_name: string;
  xp: number;
  streak_count: number;
  last_activity_date: string | null;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [equippedItems, setEquippedItems] = useState<{ icon_emoji: string; name: string }[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [profileRes, answersRes, questionsRes, itemsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("display_name, xp, streak_count, last_activity_date")
          .eq("user_id", user.id)
          .single(),
        supabase.from("answers").select("id").eq("user_id", user.id),
        supabase.from("questions").select("id"),
        supabase
          .from("user_items")
          .select("item_id, items(icon_emoji, name)")
          .eq("user_id", user.id)
          .eq("equipped", true),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      setAnsweredCount(answersRes.data?.length ?? 0);
      setTotalQuestions(questionsRes.data?.length ?? 0);
      
      if (itemsRes.data) {
        const equipped = itemsRes.data
          .map((ui: any) => ui.items)
          .filter(Boolean);
        setEquippedItems(equipped);
      }
    };

    fetchData();
  }, [user]);

  const hasUnanswered = answeredCount < totalQuestions;
  const xp = profile?.xp ?? 0;
  const level = getLevelInfo(xp);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">QuizLearn</span>
          </div>
          <div className="flex items-center gap-2">
            <StreakBadge streak={profile?.streak_count ?? 0} />
            <Button variant="ghost" size="sm" onClick={() => navigate("/ranking")}>
              <Trophy className="h-4 w-4 mr-1" /> Ranking
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/items")}>
              <Backpack className="h-4 w-4 mr-1" /> Itens
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8 max-w-2xl mx-auto space-y-6">
        {/* Hero card with avatar */}
        <Card className="glass-card overflow-hidden animate-slide-up">
          <CardContent className="pt-6">
            <div className="flex items-center gap-5">
              <AvatarDisplay xp={xp} size="lg" />
              <div className="flex-1 min-w-0 space-y-1">
                <h1 className="text-2xl font-display font-bold truncate">
                  {profile?.display_name || "Estudante"}
                </h1>
                <p className="text-sm text-muted-foreground">{level.name}</p>
                {equippedItems.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {equippedItems.map((item, i) => (
                      <span key={i} className="text-lg" title={item.name}>
                        {item.icon_emoji}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-5">
              <LevelProgressBar xp={xp} />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <Card className="glass-card">
            <CardContent className="pt-5 pb-4 text-center">
              <Zap className="h-6 w-6 text-xp mx-auto mb-1" />
              <p className="text-2xl font-display font-bold">{xp}</p>
              <p className="text-xs text-muted-foreground">XP Total</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-5 pb-4 text-center">
              <Flame className="h-6 w-6 text-accent mx-auto mb-1" />
              <p className="text-2xl font-display font-bold">{profile?.streak_count ?? 0}</p>
              <p className="text-xs text-muted-foreground">Streak</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-5 pb-4 text-center">
              <Target className="h-6 w-6 text-primary mx-auto mb-1" />
              <p className="text-2xl font-display font-bold">{answeredCount}/{totalQuestions}</p>
              <p className="text-xs text-muted-foreground">Missões</p>
            </CardContent>
          </Card>
        </div>

        {/* Mission button */}
        <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          {hasUnanswered ? (
            <Button onClick={() => navigate("/quiz")} size="lg" className="w-full text-lg h-14 font-display">
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

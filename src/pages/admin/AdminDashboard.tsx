import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Target, TrendingUp } from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalAnswers: 0,
    correctAnswers: 0,
    totalQuestions: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [profilesRes, answersRes, questionsRes] = await Promise.all([
        supabase.from("profiles").select("id, last_activity_date, blocked"),
        supabase.from("answers").select("id, is_correct"),
        supabase.from("questions").select("id"),
      ]);

      const profiles = profilesRes.data ?? [];
      const answers = answersRes.data ?? [];
      const today = new Date();
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const activeUsers = profiles.filter(
        (p) => p.last_activity_date && p.last_activity_date >= sevenDaysAgo
      ).length;

      setStats({
        totalUsers: profiles.length,
        activeUsers,
        totalAnswers: answers.length,
        correctAnswers: answers.filter((a) => a.is_correct).length,
        totalQuestions: questionsRes.data?.length ?? 0,
      });
    };

    fetchStats();
  }, []);

  const accuracy =
    stats.totalAnswers > 0
      ? ((stats.correctAnswers / stats.totalAnswers) * 100).toFixed(1)
      : "0";

  const cards = [
    { title: "Total de Usuários", value: stats.totalUsers, icon: Users, color: "text-primary" },
    { title: "Ativos (7 dias)", value: stats.activeUsers, icon: UserCheck, color: "text-success" },
    { title: "Taxa de Acerto", value: `${accuracy}%`, icon: TrendingUp, color: "text-xp" },
    { title: "Perguntas", value: stats.totalQuestions, icon: Target, color: "text-accent" },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-display font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.title} className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-display font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-display">Resumo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Total de respostas registradas: <strong className="text-foreground">{stats.totalAnswers}</strong></p>
          <p>Respostas corretas: <strong className="text-success">{stats.correctAnswers}</strong></p>
          <p>Respostas erradas: <strong className="text-destructive">{stats.totalAnswers - stats.correctAnswers}</strong></p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;

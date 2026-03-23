import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Crown, Medal, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface RankProfile {
  user_id: string;
  display_name: string;
  xp: number;
}

const Ranking = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<RankProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, xp")
        .order("xp", { ascending: false })
        .limit(50);

      setProfiles(data ?? []);
      setLoading(false);
    };

    fetchRanking();
  }, []);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-5 w-5 text-xp" />;
    if (index === 1) return <Medal className="h-5 w-5 text-muted-foreground" />;
    if (index === 2) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{index + 1}</span>;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center h-14 px-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
        </div>
      </header>

      <main className="container px-4 py-8 max-w-2xl mx-auto">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <Crown className="h-6 w-6 text-xp" /> Ranking
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Carregando...</p>
            ) : profiles.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum jogador ainda.</p>
            ) : (
              <div className="space-y-2">
                {profiles.map((p, i) => (
                  <div
                    key={p.user_id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg transition-colors",
                      p.user_id === user?.id
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-muted/50"
                    )}
                  >
                    {getRankIcon(i)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {p.display_name}
                        {p.user_id === user?.id && (
                          <span className="text-xs text-primary ml-2">(você)</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-bold text-xp">
                      <Zap className="h-4 w-4" />
                      {p.xp}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Ranking;

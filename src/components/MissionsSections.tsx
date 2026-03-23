import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Sparkles, Clock, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface MissionCount {
  extra: number;
  special: number;
  specialQuestions: { id: string; question: string; xp_reward: number; available_until: string | null }[];
}

const MissionsSections = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [missions, setMissions] = useState<MissionCount>({ extra: 0, special: 0, specialQuestions: [] });

  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      const { data: answeredIds } = await supabase
        .from("answers")
        .select("question_id")
        .eq("user_id", user.id);

      const answeredSet = new Set(answeredIds?.map((a) => a.question_id) ?? []);

      const { data: allQuestions } = await supabase
        .from("questions")
        .select("id, question, xp_reward, mission_type, available_from, available_until");

      const now = new Date().toISOString();
      const unanswered = (allQuestions ?? []).filter((q: any) => !answeredSet.has(q.id));

      const extraCount = unanswered.filter((q: any) => q.mission_type === "extra").length;

      const specialAvailable = unanswered.filter((q: any) => {
        if (q.mission_type !== "special") return false;
        if (q.available_from && q.available_from > now) return false;
        if (q.available_until && q.available_until < now) return false;
        return true;
      });

      setMissions({
        extra: extraCount,
        special: specialAvailable.length,
        specialQuestions: specialAvailable.slice(0, 3).map((q: any) => ({
          id: q.id,
          question: q.question,
          xp_reward: q.xp_reward,
          available_until: q.available_until,
        })),
      });
    };

    fetch();
  }, [user]);

  if (missions.extra === 0 && missions.special === 0) return null;

  return (
    <>
      {missions.extra > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
        >
          <Card className="glass-card border-primary/20">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-5 w-5 text-primary" />
                <span className="font-display font-bold">Missões Extras</span>
                <Badge variant="secondary" className="ml-auto">
                  {missions.extra} disponíveis
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Continue praticando! Missões extras concedem XP reduzido mas mantêm você afiado.
              </p>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => navigate("/quiz?type=extra")}
                  variant="outline"
                  className="w-full"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Iniciar missão extra
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {missions.special > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.1 }}
        >
          <Card className="glass-card border-accent/30 bg-gradient-to-br from-accent/5 to-transparent">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-accent" />
                <span className="font-display font-bold">Missões Especiais</span>
                <Badge className="ml-auto bg-accent text-accent-foreground">
                  ⭐ {missions.special} disponíveis
                </Badge>
              </div>
              <div className="space-y-2 mb-3">
                {missions.specialQuestions.map((sq) => (
                  <div
                    key={sq.id}
                    className="flex items-center justify-between text-sm p-2 rounded-lg bg-background/50"
                  >
                    <span className="truncate flex-1 mr-2">{sq.question}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="flex items-center gap-1 text-xp font-bold text-xs">
                        <Zap className="h-3 w-3" /> {sq.xp_reward} XP
                      </span>
                      {sq.available_until && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(sq.available_until).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => navigate("/quiz?type=special")}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Iniciar missão especial
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </>
  );
};

export default MissionsSections;

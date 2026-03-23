import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { playAchievementSound } from "@/lib/sounds";

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon_emoji: string;
  category: string;
  condition_type: string;
  condition_value: number;
}

export interface UserAchievement {
  id: string;
  achievement_id: string;
  unlocked_at: string;
}

export function useAchievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      supabase.from("achievements").select("*").order("condition_value"),
      supabase.from("user_achievements").select("*").eq("user_id", user.id),
    ]).then(([achRes, uaRes]) => {
      if (achRes.data) setAchievements(achRes.data as Achievement[]);
      if (uaRes.data) setUserAchievements(uaRes.data as UserAchievement[]);
      setLoading(false);
    });
  }, [user]);

  const isUnlocked = useCallback(
    (achievementId: string) => userAchievements.some((ua) => ua.achievement_id === achievementId),
    [userAchievements]
  );

  const checkAndUnlock = useCallback(
    async (stats: { xp: number; streak: number; correctAnswers: number }) => {
      if (!user || achievements.length === 0) return;

      const newlyUnlocked: Achievement[] = [];

      for (const ach of achievements) {
        if (isUnlocked(ach.id)) continue;

        let qualifies = false;
        if (ach.condition_type === "xp" && stats.xp >= ach.condition_value) qualifies = true;
        if (ach.condition_type === "streak" && stats.streak >= ach.condition_value) qualifies = true;
        if (ach.condition_type === "correct_answers" && stats.correctAnswers >= ach.condition_value) qualifies = true;

        if (qualifies) {
          const { error } = await supabase
            .from("user_achievements")
            .insert({ user_id: user.id, achievement_id: ach.id });
          if (!error) newlyUnlocked.push(ach);
        }
      }

      if (newlyUnlocked.length > 0) {
        // Refresh user achievements
        const { data } = await supabase
          .from("user_achievements")
          .select("*")
          .eq("user_id", user.id);
        if (data) setUserAchievements(data as UserAchievement[]);

        // Show toast for each
        for (const ach of newlyUnlocked) {
          toast.success(`${ach.icon_emoji} Conquista desbloqueada!`, {
            description: `${ach.name} — ${ach.description}`,
            duration: 5000,
          });
        }
      }

      return newlyUnlocked;
    },
    [user, achievements, isUnlocked]
  );

  return { achievements, userAchievements, loading, isUnlocked, checkAndUnlock };
}

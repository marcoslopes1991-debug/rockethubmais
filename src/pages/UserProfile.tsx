import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFollows } from "@/hooks/useFollows";
import { useLevels, getLevelFromList } from "@/hooks/useLevels";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Star, Zap, Flame, Users, UserPlus, UserCheck, Trophy, TrendingUp } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import LevelProgressBar from "@/components/LevelProgressBar";
import FollowListDialog from "@/components/social/FollowListDialog";
import { motion } from "framer-motion";

interface PublicProfile {
  user_id: string;
  display_name: string;
  xp: number;
  streak_count: number;
  avatar_url: string | null;
  gender: string | null;
}

interface UserAchievementDisplay {
  icon_emoji: string;
  name: string;
  unlocked_at: string;
}

interface ActivityItem {
  type: "level_up" | "streak";
  text: string;
  date: string;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { levels } = useLevels();
  const { isFollowing, toggleFollow, loading: followLoading } = useFollows();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [listType, setListType] = useState<"followers" | "following" | null>(null);
  const [topAchievements, setTopAchievements] = useState<UserAchievementDisplay[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, xp, streak_count, avatar_url, gender")
      .eq("user_id", userId)
      .single();
    if (data) setProfile(data as any);
    setLoading(false);
  }, [userId]);

  const fetchCounts = useCallback(async () => {
    if (!userId) return;
    const [{ count: followers }, { count: following }] = await Promise.all([
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
    ]);
    setFollowerCount(followers ?? 0);
    setFollowingCount(following ?? 0);
  }, [userId]);

  const fetchAchievements = useCallback(async () => {
    if (!userId) return;
    const { data: ua } = await supabase
      .from("user_achievements")
      .select("achievement_id, unlocked_at")
      .eq("user_id", userId)
      .order("unlocked_at", { ascending: false })
      .limit(5);

    if (!ua || ua.length === 0) return;

    const achIds = ua.map((a: any) => a.achievement_id);
    const { data: achs } = await supabase
      .from("achievements")
      .select("id, icon_emoji, name")
      .in("id", achIds);

    if (achs) {
      const mapped = ua.map((a: any) => {
        const ach = (achs as any[]).find((x) => x.id === a.achievement_id);
        return {
          icon_emoji: ach?.icon_emoji || "🏆",
          name: ach?.name || "",
          unlocked_at: a.unlocked_at,
        };
      });
      setTopAchievements(mapped);
    }
  }, [userId]);

  const fetchStats = useCallback(async () => {
    if (!userId) return;
    const [{ count: total }, { count: correct }] = await Promise.all([
      supabase.from("answers").select("*", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("answers").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("is_correct", true),
    ]);
    setTotalAnswered(total ?? 0);
    setCorrectAnswers(correct ?? 0);
  }, [userId]);

  useEffect(() => {
    fetchProfile();
    fetchCounts();
    fetchAchievements();
    fetchStats();
  }, [fetchProfile, fetchCounts, fetchAchievements, fetchStats]);

  // Build activity items from profile data
  useEffect(() => {
    if (!profile || levels.length === 0) return;
    const items: ActivityItem[] = [];
    const lvl = getLevelFromList(levels, profile.xp);
    if (lvl && lvl.name !== "...") {
      items.push({ type: "level_up", text: `Alcançou o nível "${lvl.name}"`, date: "" });
    }
    if (profile.streak_count > 0) {
      items.push({ type: "streak", text: `Streak atual de ${profile.streak_count} dias`, date: "" });
    }
    setActivities(items);
  }, [profile, levels]);

  // If viewing own profile, redirect
  useEffect(() => {
    if (user && userId === user.id) {
      navigate("/profile", { replace: true });
    }
  }, [user, userId, navigate]);

  const xp = profile?.xp ?? 0;
  const level = levels.length > 0 ? getLevelFromList(levels, xp) : { name: "..." };
  const isSelf = user?.id === userId;
  const following = userId ? isFollowing(userId) : false;
  const accuracy = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Usuário não encontrado.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center h-16 px-4 gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-display font-bold text-lg truncate">{profile.display_name}</span>
        </div>
      </header>

      <motion.main
        className="container px-4 py-8 max-w-lg mx-auto space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Main profile card */}
        <Card className="glass-card overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-3">
              <UserAvatar
                avatarUrl={profile.avatar_url}
                gender={profile.gender}
                displayName={profile.display_name}
                size="lg"
              />
              <div>
                <h1 className="text-xl font-display font-bold">{profile.display_name}</h1>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <Star className="h-4 w-4 text-accent" />
                  <span className="text-sm text-muted-foreground">{level.name}</span>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 flex-wrap justify-center">
                <div className="flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-xp" />
                  <span className="text-sm font-bold">{xp} XP</span>
                </div>
                {profile.streak_count > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Flame className="h-4 w-4 text-accent" />
                    <span className="text-sm font-bold">{profile.streak_count} dias</span>
                  </div>
                )}
                {totalAnswered > 0 && (
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm font-bold">{accuracy}% acerto</span>
                  </div>
                )}
              </div>

              {/* Followers / Following */}
              <div className="flex items-center gap-6 mt-2">
                <button
                  onClick={() => setListType("followers")}
                  className="flex flex-col items-center hover:opacity-80 transition-opacity"
                >
                  <span className="text-lg font-bold">{followerCount}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" /> Seguidores
                  </span>
                </button>
                <div className="h-8 w-px bg-border" />
                <button
                  onClick={() => setListType("following")}
                  className="flex flex-col items-center hover:opacity-80 transition-opacity"
                >
                  <span className="text-lg font-bold">{followingCount}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" /> Seguindo
                  </span>
                </button>
              </div>

              {/* Follow button */}
              {!isSelf && user && (
                <Button
                  variant={following ? "secondary" : "default"}
                  className="mt-2 w-full max-w-xs"
                  disabled={followLoading}
                  onClick={async () => {
                    await toggleFollow(userId!);
                    fetchCounts();
                  }}
                >
                  {following ? (
                    <><UserCheck className="h-4 w-4 mr-2" /> Seguindo</>
                  ) : (
                    <><UserPlus className="h-4 w-4 mr-2" /> Seguir</>
                  )}
                </Button>
              )}

              <div className="w-full mt-2">
                <LevelProgressBar xp={xp} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements card */}
        {topAchievements.length > 0 && (
          <Card className="glass-card">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-4 w-4 text-accent" />
                <span className="font-display font-bold text-sm">Principais conquistas</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {topAchievements.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 bg-muted/50 rounded-full px-3 py-1.5 text-xs font-medium"
                  >
                    <span>{a.icon_emoji}</span>
                    <span className="truncate max-w-[120px]">{a.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activity card */}
        {activities.length > 0 && (
          <Card className="glass-card">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="font-display font-bold text-sm">Atividade recente</span>
              </div>
              <div className="space-y-2">
                {activities.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span>{a.type === "level_up" ? "🚀" : "🔥"}</span>
                    <span className="text-muted-foreground">{a.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.main>

      {listType && userId && (
        <FollowListDialog
          userId={userId}
          type={listType}
          open={!!listType}
          onOpenChange={(open) => !open && setListType(null)}
        />
      )}
    </div>
  );
};

export default UserProfile;

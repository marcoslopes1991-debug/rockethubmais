import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useAchievements } from "@/hooks/useAchievements";
import { useFollows } from "@/hooks/useFollows";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Trophy, Target, LogOut, Backpack, Flame, Shield, Star, MapIcon, Award, Menu, Search, Users, Rss } from "lucide-react";
import AvatarDisplay from "@/components/AvatarDisplay";
import LevelProgressBar from "@/components/LevelProgressBar";
import StreakBadge from "@/components/StreakBadge";
import { useLevels, getLevelFromList, getNextLevelFromList } from "@/hooks/useLevels";
import { motion } from "framer-motion";
import SoundToggle from "@/components/SoundToggle";
import MissionsSections from "@/components/MissionsSections";
import NotificationBell from "@/components/NotificationBell";
import UserSearchDialog from "@/components/social/UserSearchDialog";
import SuggestedUsers from "@/components/social/SuggestedUsers";
import ActionCard from "@/components/dashboard/ActionCard";
import FollowListDialog from "@/components/social/FollowListDialog";
import { useAppBranding } from "@/hooks/useAppBranding";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface ProfileData {
  display_name: string;
  username: string | null;
  bio: string | null;
  xp: number;
  streak_count: number;
  last_activity_date: string | null;
  modulos_interesse: string[] | null;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const { levels } = useLevels();
  const { achievements, userAchievements, isUnlocked } = useAchievements();
  const { followerCount, followingCount, fetchCounts } = useFollows();
  const unlockedAchievements = achievements.filter((a) => isUnlocked(a.id));
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [equippedItems, setEquippedItems] = useState<{ icon_emoji: string; name: string }[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [followDialogType, setFollowDialogType] = useState<"followers" | "following">("followers");
  const [followDialogOpen, setFollowDialogOpen] = useState(false);
  const { appName, logoUrl: brandLogoUrl } = useAppBranding();

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [profileRes, answersRes, questionsRes, itemsRes, postsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("display_name, username, bio, xp, streak_count, last_activity_date, modulos_interesse")
          .eq("user_id", user.id)
          .single(),
        supabase.from("answers").select("id").eq("user_id", user.id),
        supabase.from("questions").select("id"),
        supabase
          .from("user_items")
          .select("item_id, items(icon_emoji, name)")
          .eq("user_id", user.id)
          .eq("equipped", true),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      setAnsweredCount(answersRes.data?.length ?? 0);
      setTotalQuestions(questionsRes.data?.length ?? 0);
      setPostsCount(postsRes.count ?? 0);
      
      if (itemsRes.data) {
        const equipped = itemsRes.data
          .map((ui: any) => ui.items)
          .filter(Boolean);
        setEquippedItems(equipped);
      }
    };

    fetchData();
    fetchCounts(user.id);
  }, [user, fetchCounts]);

  const hasUnanswered = answeredCount < totalQuestions;
  const xp = profile?.xp ?? 0;
  const level = levels.length > 0 ? getLevelFromList(levels, xp) : { name: "Carregando..." };
  const nextLevel = levels.length > 0 ? getNextLevelFromList(levels, xp) : null;
  const xpRemaining = nextLevel ? nextLevel.min_xp - xp : 0;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4">
          <motion.div 
            className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink-0"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            {brandLogoUrl ? (
              <img src={brandLogoUrl} alt={appName} className="h-7 w-7 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl object-contain" />
            ) : (
              <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl bg-primary">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
              </div>
            )}
            <span className="font-display font-bold text-sm sm:text-lg truncate max-w-[100px] sm:max-w-none">{appName}</span>
          </motion.div>
          <div className="flex items-center gap-0.5 sm:gap-2">
            <StreakBadge streak={profile?.streak_count ?? 0} />
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={() => setSearchOpen(true)} title="Buscar">
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={() => navigate("/evolution-map")} title="Mapa">
              <MapIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 hidden sm:inline-flex" onClick={() => navigate("/ranking")} title="Ranking">
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <NotificationBell />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" title="Menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle className="font-display">Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2 mt-6">
                  <Button variant="ghost" className="justify-start h-12 text-base sm:hidden" onClick={() => navigate("/ranking")}>
                    <Trophy className="h-5 w-5 mr-3" /> Ranking
                  </Button>
                  <Button variant="ghost" className="justify-start h-12 text-base" onClick={() => navigate("/journey")}>
                    <Star className="h-5 w-5 mr-3" /> Jornada
                  </Button>
                  <Button variant="ghost" className="justify-start h-12 text-base" onClick={() => navigate("/items")}>
                    <Backpack className="h-5 w-5 mr-3" /> Itens
                  </Button>
                  <Button variant="ghost" className="justify-start h-12 text-base" onClick={() => navigate("/achievements")}>
                    <Award className="h-5 w-5 mr-3" /> Conquistas
                  </Button>
                  {isAdmin && (
                    <Button variant="ghost" className="justify-start h-12 text-base" onClick={() => navigate("/admin")}>
                      <Shield className="h-5 w-5 mr-3" /> Admin
                    </Button>
                  )}
                  <div className="border-t border-border my-2" />
                  <div className="flex items-center gap-2 px-4">
                    <SoundToggle />
                    <span className="text-sm text-muted-foreground">Som</span>
                  </div>
                  <Button variant="ghost" className="justify-start h-12 text-base text-destructive" onClick={signOut}>
                    <LogOut className="h-5 w-5 mr-3" /> Sair
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <motion.main 
        className="container px-4 py-8 max-w-2xl mx-auto space-y-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Hero card with avatar */}
        <motion.div variants={item}>
          <Card className="glass-card overflow-hidden">
            <CardContent className="pt-6 space-y-5">
              {/* BLOCO 1 — IDENTIDADE */}
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 3 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  onClick={() => navigate("/profile")}
                  className="cursor-pointer shrink-0"
                >
                  <AvatarDisplay xp={xp} size="lg" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-display font-bold truncate leading-tight">
                    {profile?.display_name || "Estudante"}
                  </h1>
                  {profile?.username && (
                    <p className="text-sm text-muted-foreground mt-0.5">@{profile.username}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-1">
                    <Star className="h-3.5 w-3.5 text-accent" />
                    <span className="text-xs font-semibold text-muted-foreground">{level.name}</span>
                  </div>
                  {equippedItems.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-1.5">
                      {equippedItems.map((eqItem, i) => (
                        <motion.span
                          key={i}
                          className="text-base"
                          title={eqItem.name}
                          whileHover={{ scale: 1.3, rotate: 10 }}
                        >
                          {eqItem.icon_emoji}
                        </motion.span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* BLOCO 2 — BIO E CONTEXTO */}
              <div className="space-y-2.5">
                {profile?.bio ? (
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{profile.bio}</p>
                ) : (
                  <button
                    onClick={() => navigate("/profile")}
                    className="text-sm text-muted-foreground/40 italic hover:text-muted-foreground transition-colors"
                  >
                    Adicione uma bio...
                  </button>
                )}
                {profile?.modulos_interesse && profile.modulos_interesse.filter(mod => mod && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mod)).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.modulos_interesse.filter(mod => mod && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mod)).map((mod) => (
                      <span
                        key={mod}
                        className="text-[11px] px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground font-bold tracking-wide"
                      >
                        {mod}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* BLOCO 3 — SOCIAL */}
              <div className="flex items-center justify-around py-3 rounded-lg bg-muted/40">
                <button
                  onClick={() => { setFollowDialogType("followers"); setFollowDialogOpen(true); }}
                  className="flex flex-col items-center gap-0.5 hover:opacity-70 transition-opacity"
                >
                  <span className="text-lg font-display font-bold">{followerCount}</span>
                  <span className="text-[11px] text-muted-foreground font-medium">seguidores</span>
                </button>
                <div className="w-px h-8 bg-border/60" />
                <button
                  onClick={() => { setFollowDialogType("following"); setFollowDialogOpen(true); }}
                  className="flex flex-col items-center gap-0.5 hover:opacity-70 transition-opacity"
                >
                  <span className="text-lg font-display font-bold">{followingCount}</span>
                  <span className="text-[11px] text-muted-foreground font-medium">seguindo</span>
                </button>
                <div className="w-px h-8 bg-border/60" />
                <button
                  onClick={() => navigate("/profile")}
                  className="flex flex-col items-center gap-0.5 hover:opacity-70 transition-opacity"
                >
                  <span className="text-lg font-display font-bold">0</span>
                  <span className="text-[11px] text-muted-foreground font-medium">posts</span>
                </button>
              </div>

              {/* BLOCO 4 — PROGRESSO */}
              <div>
                <LevelProgressBar xp={xp} />
                {nextLevel && (
                  <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                    <Zap className="h-3 w-3 text-primary" />
                    Faltam <span className="font-bold text-foreground">{xpRemaining} XP</span> para {nextLevel.name}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        <motion.div className="grid grid-cols-3 gap-3" variants={item}>
          {(() => {
            const streak = profile?.streak_count ?? 0;
            const streakMsg = streak === 0
              ? "Comece hoje! 💪"
              : streak <= 2
              ? "Começando sua sequência 🔥"
              : streak <= 6
              ? "Você está indo bem 🚀"
              : streak <= 13
              ? "Não perca hoje! 🎯"
              : "Imparável! ⚡";

            const stats = [
              { icon: Zap, value: xp, label: "XP Total", color: "text-xp", msg: null },
              { icon: Flame, value: streak, label: "Streak", color: "text-accent", msg: streakMsg },
              { icon: Target, value: `${progressPercent}%`, label: "Progresso", color: "text-primary", msg: null },
            ];

            return stats.map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05, y: -4 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Card className={cn("glass-card cursor-default", stat.msg && streak > 0 && "border-accent/30")}>
                  <CardContent className="pt-5 pb-4 text-center">
                    <stat.icon className={`h-6 w-6 ${stat.color} mx-auto mb-1`} />
                    <p className="text-2xl font-display font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    {stat.msg && (
                      <p className="text-[10px] text-accent font-medium mt-1">{stat.msg}</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ));
          })()}
        </motion.div>

        {/* Achievements showcase */}
        {unlockedAchievements.length > 0 && (
          <motion.div variants={item}>
            <Card className="glass-card">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    <span className="font-display font-bold text-sm">Conquistas</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/achievements")} className="text-xs text-muted-foreground">
                    Ver todas →
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {unlockedAchievements.map((ach, i) => (
                    <motion.div
                      key={ach.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ scale: 1.08 }}
                      title={ach.description}
                    >
                      <span className="text-base">{ach.icon_emoji}</span>
                      <span className="text-xs font-bold text-foreground">{ach.name}</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Mission button */}
        <motion.div variants={item}>
          {hasUnanswered ? (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button onClick={() => navigate("/quiz")} size="lg" className="w-full text-lg h-14 font-display">
                <Target className="h-5 w-5 mr-2" />
                Responder missão do dia
              </Button>
            </motion.div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50 border border-border/50">
              <Trophy className="h-5 w-5 text-muted-foreground shrink-0" />
              <p className="text-sm text-muted-foreground">Você respondeu todas as perguntas disponíveis 🎉</p>
            </div>
           )}
        </motion.div>

        {/* Extra & Special Missions */}
        <MissionsSections />

        {/* User suggestions */}
        <motion.div variants={item}>
          <SuggestedUsers />
        </motion.div>
      </motion.main>

      <UserSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      {user && (
        <FollowListDialog
          userId={user.id}
          type={followDialogType}
          open={followDialogOpen}
          onOpenChange={setFollowDialogOpen}
        />
      )}
    </div>
  );
};

export default Dashboard;

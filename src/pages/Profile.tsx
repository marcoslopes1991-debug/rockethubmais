import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLevels, getLevelFromList } from "@/hooks/useLevels";
import { isSoundEnabled, setSoundEnabled } from "@/lib/sounds";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Volume2, Shield, Star, Zap, Bell } from "lucide-react";
import AvatarDisplay from "@/components/AvatarDisplay";
import LevelProgressBar from "@/components/LevelProgressBar";
import { motion } from "framer-motion";

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { levels } = useLevels();
  const [profile, setProfile] = useState<{ display_name: string; xp: number; notifications_enabled: boolean } | null>(null);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [notificationsOn, setNotificationsOn] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, xp")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data);
      });
  }, [user]);

  const xp = profile?.xp ?? 0;
  const level = levels.length > 0 ? getLevelFromList(levels, xp) : { name: "Carregando..." };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundOn(next);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center h-16 px-4 gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-display font-bold text-lg">Perfil & Configurações</span>
        </div>
      </header>

      <motion.main
        className="container px-4 py-8 max-w-lg mx-auto space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* User info */}
        <Card className="glass-card overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-3">
              <AvatarDisplay xp={xp} size="lg" />
              <div>
                <h1 className="text-xl font-display font-bold">{profile?.display_name || "Estudante"}</h1>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <Star className="h-4 w-4 text-accent" />
                  <span className="text-sm text-muted-foreground">{level.name}</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <Zap className="h-4 w-4 text-xp" />
                  <span className="text-sm font-bold">{xp} XP</span>
                </div>
              </div>
              <div className="w-full mt-2">
                <LevelProgressBar xp={xp} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sound settings */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-primary" />
              Sons
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Efeitos sonoros</p>
                <p className="text-xs text-muted-foreground">Acerto, erro, conquista e evolução de nível</p>
              </div>
              <Switch checked={soundOn} onCheckedChange={toggleSound} />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Autenticação em 2 fatores</p>
                <p className="text-xs text-muted-foreground">Em breve</p>
              </div>
              <Switch disabled checked={false} />
            </div>
          </CardContent>
        </Card>
      </motion.main>
    </div>
  );
};

export default Profile;

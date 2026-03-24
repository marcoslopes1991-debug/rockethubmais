import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFollows } from "@/hooks/useFollows";
import { useLevels, getLevelFromList } from "@/hooks/useLevels";
import { isSoundEnabled, setSoundEnabled } from "@/lib/sounds";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Volume2, Shield, Star, Zap, Bell, Users, Camera, Search } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import LevelProgressBar from "@/components/LevelProgressBar";
import FollowListDialog from "@/components/social/FollowListDialog";
import UserSearchDialog from "@/components/social/UserSearchDialog";
import { motion } from "framer-motion";
import { toast } from "sonner";

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { levels } = useLevels();
  const { followerCount, followingCount, fetchCounts } = useFollows();
  const [profile, setProfile] = useState<{
    display_name: string;
    xp: number;
    notifications_enabled: boolean;
    avatar_url: string | null;
    gender: string | null;
  } | null>(null);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [listType, setListType] = useState<"followers" | "following" | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, xp, notifications_enabled, avatar_url, gender")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfile(data as any);
          setNotificationsOn((data as any).notifications_enabled ?? true);
        }
      });
    fetchCounts(user.id);
  }, [user, fetchCounts]);

  const xp = profile?.xp ?? 0;
  const level = levels.length > 0 ? getLevelFromList(levels, xp) : { name: "Carregando..." };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundOn(next);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Formato não suportado. Use JPG ou PNG.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 2MB.");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("user_id", user.id);

      setProfile((prev) => prev ? { ...prev, avatar_url: avatarUrl } : prev);
      toast.success("Foto atualizada!");
    } catch (err: any) {
      toast.error("Erro ao enviar foto: " + err.message);
    } finally {
      setUploading(false);
    }
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
              {/* Avatar with upload overlay */}
              <div className="relative group">
                <UserAvatar
                  avatarUrl={profile?.avatar_url}
                  gender={profile?.gender}
                  displayName={profile?.display_name}
                  size="lg"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                >
                  <Camera className="h-6 w-6 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-xs text-primary font-medium hover:underline"
              >
                {uploading ? "Enviando..." : "Alterar foto"}
              </button>

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

              {/* Followers / Following */}
              <div className="flex items-center gap-6 mt-2">
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold">{followerCount}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" /> Seguidores
                  </span>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold">{followingCount}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" /> Seguindo
                  </span>
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

        {/* Notification settings */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Notificações do app</p>
                <p className="text-xs text-muted-foreground">Missões especiais, streak em risco e lembretes</p>
              </div>
              <Switch
                checked={notificationsOn}
                onCheckedChange={async (checked) => {
                  setNotificationsOn(checked);
                  if (user) {
                    await supabase
                      .from("profiles")
                      .update({ notifications_enabled: checked })
                      .eq("user_id", user.id);
                  }
                }}
              />
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

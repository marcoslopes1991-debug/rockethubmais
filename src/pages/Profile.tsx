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
import { ArrowLeft, Volume2, Shield, Star, Zap, Bell, Camera, Search, FileText } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import LevelProgressBar from "@/components/LevelProgressBar";
import FollowListDialog from "@/components/social/FollowListDialog";
import UserSearchDialog from "@/components/social/UserSearchDialog";
import PrivacySettings from "@/components/profile/PrivacySettings";
import ProfileBio from "@/components/profile/ProfileBio";
import ModuleBadges from "@/components/profile/ModuleBadges";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface ProfileData {
  display_name: string;
  xp: number;
  notifications_enabled: boolean;
  avatar_url: string | null;
  gender: string | null;
  is_public: boolean;
  hide_followers: boolean;
  username: string | null;
  bio: string;
  modulos_interesse: string[] | null;
}

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { levels } = useLevels();
  const { followerCount, followingCount, fetchCounts } = useFollows();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [listType, setListType] = useState<"followers" | "following" | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [postsCount] = useState(0); // Prepared for future posts feature
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, xp, notifications_enabled, avatar_url, gender, is_public, hide_followers, username, bio, modulos_interesse")
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
          <span className="font-display font-bold text-lg">
            {profile?.username ? `@${profile.username}` : "Perfil"}
          </span>
        </div>
      </header>

      <motion.main
        className="container px-4 py-6 max-w-lg mx-auto space-y-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Social profile header */}
        <Card className="glass-card overflow-hidden">
          <CardContent className="pt-6 pb-5">
            {/* Top row: avatar + counters */}
            <div className="flex items-center gap-5">
              {/* Avatar with upload */}
              <div className="relative group shrink-0">
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

              {/* Stats counters */}
              <div className="flex-1 flex items-center justify-around">
                <button className="flex flex-col items-center" disabled>
                  <span className="text-lg font-bold">{postsCount}</span>
                  <span className="text-xs text-muted-foreground">
                    <FileText className="h-3 w-3 inline mr-0.5" />Posts
                  </span>
                </button>
                <button
                  onClick={() => setListType("followers")}
                  className="flex flex-col items-center hover:opacity-80 transition-opacity"
                >
                  <span className="text-lg font-bold">{followerCount}</span>
                  <span className="text-xs text-muted-foreground">Seguidores</span>
                </button>
                <button
                  onClick={() => setListType("following")}
                  className="flex flex-col items-center hover:opacity-80 transition-opacity"
                >
                  <span className="text-lg font-bold">{followingCount}</span>
                  <span className="text-xs text-muted-foreground">Seguindo</span>
                </button>
              </div>
            </div>

            {/* Name + username + level */}
            <div className="mt-4 space-y-1">
              <h1 className="text-base font-display font-bold">{profile?.display_name || "Estudante"}</h1>
              {profile?.username && (
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
              )}
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Star className="h-3.5 w-3.5 text-accent" /> {level.name}
                </span>
                <span className="flex items-center gap-1 font-bold">
                  <Zap className="h-3.5 w-3.5 text-xp" /> {xp} XP
                </span>
              </div>
            </div>

            {/* Bio */}
            <div className="mt-3">
              <ProfileBio
                bio={profile?.bio ?? ""}
                editable
                onUpdate={(newBio) => setProfile((prev) => prev ? { ...prev, bio: newBio } : prev)}
              />
            </div>

            {/* Module badges */}
            {profile?.modulos_interesse && profile.modulos_interesse.length > 0 && (
              <div className="mt-3">
                <ModuleBadges modules={profile.modulos_interesse} />
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Camera className="h-4 w-4 mr-1.5" />
                {uploading ? "Enviando..." : "Editar foto"}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-4 w-4 mr-1.5" /> Buscar
              </Button>
            </div>

            {/* Level progress */}
            <div className="mt-4">
              <LevelProgressBar xp={xp} />
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

        {/* Privacy */}
        {profile && (
          <PrivacySettings
            isPublic={profile.is_public}
            hideFollowers={profile.hide_followers}
          />
        )}

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

      {listType && user && (
        <FollowListDialog
          userId={user.id}
          type={listType}
          open={!!listType}
          onOpenChange={(open) => !open && setListType(null)}
        />
      )}

      <UserSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
};

export default Profile;

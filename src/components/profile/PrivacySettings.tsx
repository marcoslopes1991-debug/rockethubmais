import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Eye } from "lucide-react";

interface PrivacySettingsProps {
  isPublic: boolean;
  hideFollowers: boolean;
}

const PrivacySettings = ({ isPublic: initialPublic, hideFollowers: initialHide }: PrivacySettingsProps) => {
  const { user } = useAuth();
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [hideFollowers, setHideFollowers] = useState(initialHide);

  const updateField = async (field: string, value: boolean) => {
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ [field]: value } as any)
      .eq("user_id", user.id);
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          Privacidade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Perfil público</p>
            <p className="text-xs text-muted-foreground">Qualquer usuário pode ver seu perfil</p>
          </div>
          <Switch
            checked={isPublic}
            onCheckedChange={(checked) => {
              setIsPublic(checked);
              updateField("is_public", checked);
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Ocultar seguidores</p>
            <p className="text-xs text-muted-foreground">Esconder lista de seguidores do perfil</p>
          </div>
          <Switch
            checked={hideFollowers}
            onCheckedChange={(checked) => {
              setHideFollowers(checked);
              updateField("hide_followers", checked);
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PrivacySettings;

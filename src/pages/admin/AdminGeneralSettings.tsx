import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Settings, Upload, Trash2, Save, ImageIcon, Target } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const AdminGeneralSettings = () => {
  const [configId, setConfigId] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Mission config state
  const [missionConfigId, setMissionConfigId] = useState<string | null>(null);
  const [dailyCount, setDailyCount] = useState(5);
  const [extraCount, setExtraCount] = useState<number | "">("");
  const [specialCount, setSpecialCount] = useState<number | "">("");
  const [savingMission, setSavingMission] = useState(false);

  useEffect(() => {
    supabase
      .from("ai_config" as any)
      .select("id, logo_url")
      .limit(1)
      .single()
      .then(({ data }: any) => {
        if (data) {
          setConfigId(data.id);
          setLogoUrl(data.logo_url);
        }
      });

    supabase
      .from("mission_config" as any)
      .select("*")
      .limit(1)
      .single()
      .then(({ data }: any) => {
        if (data) {
          setMissionConfigId(data.id);
          setDailyCount(data.daily_question_count ?? 5);
          setExtraCount(data.extra_question_count ?? "");
          setSpecialCount(data.special_question_count ?? "");
        }
      });
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Arquivo inválido", description: "Selecione uma imagem PNG ou JPG", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `app-logo-${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("ai-config").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("ai-config").getPublicUrl(path);
    setLogoUrl(urlData.publicUrl);
    setUploading(false);
    toast({ title: "Logo carregada!" });
  };

  const removeLogo = () => {
    setLogoUrl(null);
  };

  const save = async () => {
    if (!configId) return;
    setSaving(true);
    const { error } = await supabase
      .from("ai_config" as any)
      .update({ logo_url: logoUrl, updated_at: new Date().toISOString() } as any)
      .eq("id", configId);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Configurações salvas!" });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-display font-bold flex items-center gap-2">
        <Settings className="h-6 w-6 text-primary" />
        Configurações Gerais
      </h1>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Logo da Aplicação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Logo atual</Label>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl border-2 border-border bg-muted flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <ImageIcon className="h-8 w-8" />
                    <span className="text-[10px]">Sem logo</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                  className="hidden"
                  onChange={handleUpload}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Enviando..." : "Enviar logo"}
                </Button>
                {logoUrl && (
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={removeLogo}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remover logo
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">PNG, JPG ou SVG. Será exibida na tela de login/cadastro.</p>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="border border-border rounded-xl p-6 bg-muted/30">
            <p className="text-xs text-muted-foreground mb-3">Pré-visualização na tela de login:</p>
            <div className="flex flex-col items-center gap-2">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo preview" className="h-16 object-contain" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
                  <span className="text-2xl text-primary-foreground font-bold">⚡</span>
                </div>
              )}
              <p className="text-sm text-muted-foreground">Bem-vindo de volta!</p>
            </div>
          </div>

          <Button onClick={save} disabled={saving} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Salvando..." : "Salvar configurações"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminGeneralSettings;

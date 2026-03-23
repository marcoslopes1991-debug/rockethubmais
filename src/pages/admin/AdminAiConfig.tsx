import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Bot, Upload, Trash2, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import rockzMascot from "@/assets/rockz-mascot.png";

const AdminAiConfig = () => {
  const [config, setConfig] = useState<{ id: string; ai_name: string; button_image_url: string | null } | null>(null);
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase
      .from("ai_config" as any)
      .select("id, ai_name, button_image_url")
      .limit(1)
      .single()
      .then(({ data }: any) => {
        if (data) {
          setConfig(data);
          setName(data.ai_name);
          setImageUrl(data.button_image_url);
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
    const path = `button-icon-${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("ai-config").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("ai-config").getPublicUrl(path);
    setImageUrl(urlData.publicUrl);
    setUploading(false);
    toast({ title: "Imagem carregada!" });
  };

  const removeImage = () => {
    setImageUrl(null);
  };

  const save = async () => {
    if (!config) return;
    setSaving(true);
    const { error } = await supabase
      .from("ai_config" as any)
      .update({ ai_name: name, button_image_url: imageUrl, updated_at: new Date().toISOString() } as any)
      .eq("id", config.id);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Configurações salvas!" });
    }
    setSaving(false);
  };

  const previewSrc = imageUrl || rockzMascot;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-display font-bold flex items-center gap-2">
        <Bot className="h-6 w-6 text-primary" />
        Configurações da IA
      </h1>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Nome e Visual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* AI Name */}
          <div className="space-y-2">
            <Label htmlFor="ai-name">Nome da IA</Label>
            <Input
              id="ai-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: RockZ"
            />
            <p className="text-xs text-muted-foreground">Este nome aparecerá no cabeçalho do chat</p>
          </div>

          {/* Image upload */}
          <div className="space-y-3">
            <Label>Imagem do Botão</Label>
            <div className="flex items-center gap-6">
              <div className="relative">
                <img
                  src={previewSrc}
                  alt="Preview"
                  className="w-20 h-20 rounded-full border-2 border-border object-cover bg-muted"
                />
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
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
                  {uploading ? "Enviando..." : "Enviar imagem"}
                </Button>
                {imageUrl && (
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={removeImage}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remover imagem
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">PNG ou JPG. Será usado como ícone do botão flutuante.</p>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="border border-border rounded-xl p-4 bg-muted/30">
            <p className="text-xs text-muted-foreground mb-3">Pré-visualização do botão:</p>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary p-1 shadow-lg">
                <img src={previewSrc} alt="Preview" className="w-14 h-14 rounded-full" />
              </div>
              <div>
                <p className="font-display font-bold text-sm">{name || "RockZ"} - Assistente IA</p>
                <p className="text-xs text-muted-foreground">Especialista em SAP SD</p>
              </div>
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

export default AdminAiConfig;

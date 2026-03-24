import { useState, useRef } from "react";
import { useLevels, DbLevel } from "@/hooks/useLevels";
import { supabase } from "@/integrations/supabase/client";
import { getAvatarForLevel } from "@/lib/levels";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Upload, Trash2, ImageIcon } from "lucide-react";

interface AvatarForm {
  name: string;
  min_xp: number;
  description: string;
  avatar_male_url: string | null;
  avatar_female_url: string | null;
}

const AdminLevels = () => {
  const { levels, loading, refetch } = useLevels();
  const { toast } = useToast();
  const [editing, setEditing] = useState<DbLevel | null>(null);
  const [form, setForm] = useState<AvatarForm>({ name: "", min_xp: 0, description: "", avatar_male_url: null, avatar_female_url: null });
  const [previewMale, setPreviewMale] = useState<string | null>(null);
  const [previewFemale, setPreviewFemale] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"male" | "female" | null>(null);
  const [saving, setSaving] = useState(false);
  const maleInputRef = useRef<HTMLInputElement>(null);
  const femaleInputRef = useRef<HTMLInputElement>(null);

  const handleEdit = (level: DbLevel) => {
    setEditing(level);
    setForm({
      name: level.name,
      min_xp: level.min_xp,
      description: level.description,
      avatar_male_url: level.avatar_male_url,
      avatar_female_url: level.avatar_female_url,
    });
    setPreviewMale(null);
    setPreviewFemale(null);
  };

  const handleClose = () => {
    setEditing(null);
    // Revoke object URLs to free memory
    if (previewMale) URL.revokeObjectURL(previewMale);
    if (previewFemale) URL.revokeObjectURL(previewFemale);
    setPreviewMale(null);
    setPreviewFemale(null);
  };

  const handleFileSelect = async (file: File, type: "male" | "female") => {
    if (!editing) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["png", "jpg", "jpeg"].includes(ext || "")) {
      toast({ title: "Formato inválido", description: "Use PNG, JPG ou JPEG.", variant: "destructive" });
      return;
    }

    // Instant local preview
    const localUrl = URL.createObjectURL(file);
    if (type === "male") {
      if (previewMale) URL.revokeObjectURL(previewMale);
      setPreviewMale(localUrl);
    } else {
      if (previewFemale) URL.revokeObjectURL(previewFemale);
      setPreviewFemale(localUrl);
    }

    // Upload in background
    setUploading(type);
    const path = `levels/${editing.id}/${type}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
      // Revert preview
      if (type === "male") { URL.revokeObjectURL(localUrl); setPreviewMale(null); }
      else { URL.revokeObjectURL(localUrl); setPreviewFemale(null); }
      setUploading(null);
      return;
    }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${urlData.publicUrl}?t=${Date.now()}`;
    setForm((f) => ({ ...f, [type === "male" ? "avatar_male_url" : "avatar_female_url"]: url }));
    setUploading(null);
    toast({ title: `Avatar ${type === "male" ? "masculino" : "feminino"} enviado!` });
  };

  const handleRemoveAvatar = (type: "male" | "female") => {
    if (type === "male") {
      if (previewMale) URL.revokeObjectURL(previewMale);
      setPreviewMale(null);
      setForm((f) => ({ ...f, avatar_male_url: null }));
    } else {
      if (previewFemale) URL.revokeObjectURL(previewFemale);
      setPreviewFemale(null);
      setForm((f) => ({ ...f, avatar_female_url: null }));
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase
      .from("levels")
      .update({
        name: form.name,
        min_xp: form.min_xp,
        description: form.description,
        avatar_male_url: form.avatar_male_url || null,
        avatar_female_url: form.avatar_female_url || null,
      })
      .eq("id", editing.id);

    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Nível atualizado!" });
      handleClose();
      refetch();
    }
  };

  const getDisplayImage = (type: "male" | "female"): string | null => {
    const localPreview = type === "male" ? previewMale : previewFemale;
    if (localPreview) return localPreview;
    const savedUrl = type === "male" ? form.avatar_male_url : form.avatar_female_url;
    return savedUrl || null;
  };

  const fallbackAvatar = editing ? getAvatarForLevel(editing.level_number) : "";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">Níveis</h1>

      <Card>
        <CardHeader>
          <CardTitle>Progressão de Níveis</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-24">XP Min</TableHead>
                  <TableHead>Avatares</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {levels.map((level) => (
                  <TableRow key={level.id}>
                    <TableCell className="font-bold">{level.level_number}</TableCell>
                    <TableCell className="font-medium">{level.name}</TableCell>
                    <TableCell>{level.min_xp}</TableCell>
                    <TableCell>
                      <div className="flex gap-2 items-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <img
                            src={level.avatar_male_url || getAvatarForLevel(level.level_number)}
                            alt="♂"
                            className="w-8 h-8 rounded-full object-cover border border-border"
                          />
                          <span className="text-[10px] text-muted-foreground">♂</span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                          <img
                            src={level.avatar_female_url || getAvatarForLevel(level.level_number)}
                            alt="♀"
                            className="w-8 h-8 rounded-full object-cover border border-border"
                          />
                          <span className="text-[10px] text-muted-foreground">♀</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {level.description}
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(level)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Nível {editing?.level_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium">Nome</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">XP Mínimo</label>
              <Input
                type="number"
                value={form.min_xp}
                onChange={(e) => setForm({ ...form, min_xp: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição Narrativa</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Avatar previews side by side */}
            <div>
              <label className="text-sm font-medium mb-2 block">Avatares do Nível</label>
              <div className="grid grid-cols-2 gap-4">
                {/* Male */}
                <AvatarUploadCard
                  label="Masculino ♂"
                  imageUrl={getDisplayImage("male")}
                  fallback={fallbackAvatar}
                  isUploading={uploading === "male"}
                  inputRef={maleInputRef}
                  onFileSelect={(file) => handleFileSelect(file, "male")}
                  onRemove={() => handleRemoveAvatar("male")}
                  hasCustomImage={!!getDisplayImage("male")}
                />
                {/* Female */}
                <AvatarUploadCard
                  label="Feminino ♀"
                  imageUrl={getDisplayImage("female")}
                  fallback={fallbackAvatar}
                  isUploading={uploading === "female"}
                  inputRef={femaleInputRef}
                  onFileSelect={(file) => handleFileSelect(file, "female")}
                  onRemove={() => handleRemoveAvatar("female")}
                  hasCustomImage={!!getDisplayImage("female")}
                />
              </div>
            </div>

            <Button onClick={handleSave} className="w-full" disabled={saving || !!uploading}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface AvatarUploadCardProps {
  label: string;
  imageUrl: string | null;
  fallback: string;
  isUploading: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  hasCustomImage: boolean;
}

const AvatarUploadCard = ({ label, imageUrl, fallback, isUploading, inputRef, onFileSelect, onRemove, hasCustomImage }: AvatarUploadCardProps) => (
  <div className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-muted/30">
    <span className="text-xs font-semibold text-muted-foreground">{label}</span>
    <div className="relative">
      <img
        src={imageUrl || fallback}
        alt={label}
        className="w-20 h-20 rounded-full object-cover border-2 border-border shadow-sm"
      />
      {!imageUrl && (
        <div className="absolute inset-0 rounded-full bg-muted/60 flex items-center justify-center">
          <ImageIcon className="h-5 w-5 text-muted-foreground/60" />
        </div>
      )}
      {isUploading && (
        <div className="absolute inset-0 rounded-full bg-background/70 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}
    </div>
    <input
      ref={inputRef}
      type="file"
      accept=".png,.jpg,.jpeg"
      className="hidden"
      onChange={(e) => { if (e.target.files?.[0]) { onFileSelect(e.target.files[0]); e.target.value = ""; } }}
    />
    <div className="flex gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
        className="text-xs h-7 px-2"
      >
        <Upload className="h-3 w-3 mr-1" />
        {isUploading ? "Enviando..." : hasCustomImage ? "Trocar" : "Upload"}
      </Button>
      {hasCustomImage && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-xs h-7 px-2 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  </div>
);

export default AdminLevels;

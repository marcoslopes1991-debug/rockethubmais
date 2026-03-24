import { useState, useRef } from "react";
import { useLevels, DbLevel } from "@/hooks/useLevels";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Upload, X } from "lucide-react";

const AdminLevels = () => {
  const { levels, loading, refetch } = useLevels();
  const { toast } = useToast();
  const [editing, setEditing] = useState<DbLevel | null>(null);
  const [form, setForm] = useState({ name: "", min_xp: 0, description: "", avatar_male_url: "" as string | null, avatar_female_url: "" as string | null });
  const [uploading, setUploading] = useState<"male" | "female" | null>(null);
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
  };

  const handleUpload = async (file: File, type: "male" | "female") => {
    if (!editing) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["png", "jpg", "jpeg"].includes(ext || "")) {
      toast({ title: "Formato inválido", description: "Use PNG, JPG ou JPEG.", variant: "destructive" });
      return;
    }
    setUploading(type);
    const path = `levels/${editing.id}/${type}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
      setUploading(null);
      return;
    }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${urlData.publicUrl}?t=${Date.now()}`;
    setForm((f) => ({ ...f, [type === "male" ? "avatar_male_url" : "avatar_female_url"]: url }));
    setUploading(null);
  };

  const handleSave = async () => {
    if (!editing) return;
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

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Nível atualizado!" });
      setEditing(null);
      refetch();
    }
  };

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
                      <div className="flex gap-1">
                        {level.avatar_male_url && (
                          <img src={level.avatar_male_url} alt="M" className="w-8 h-8 rounded-full object-cover" />
                        )}
                        {level.avatar_female_url && (
                          <img src={level.avatar_female_url} alt="F" className="w-8 h-8 rounded-full object-cover" />
                        )}
                        {!level.avatar_male_url && !level.avatar_female_url && (
                          <span className="text-xs text-muted-foreground italic">Padrão</span>
                        )}
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

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Nível {editing?.level_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
                rows={4}
              />
            </div>

            {/* Avatar Masculino */}
            <div>
              <label className="text-sm font-medium">Avatar Masculino</label>
              <input
                ref={maleInputRef}
                type="file"
                accept=".png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "male")}
              />
              <div className="flex items-center gap-3 mt-1">
                {form.avatar_male_url ? (
                  <div className="relative">
                    <img src={form.avatar_male_url} alt="Avatar masculino" className="w-16 h-16 rounded-full object-cover border-2 border-border" />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, avatar_male_url: null })}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs">♂</div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading === "male"}
                  onClick={() => maleInputRef.current?.click()}
                >
                  <Upload className="h-3 w-3 mr-1" />
                  {uploading === "male" ? "Enviando..." : "Upload"}
                </Button>
              </div>
            </div>

            {/* Avatar Feminino */}
            <div>
              <label className="text-sm font-medium">Avatar Feminino</label>
              <input
                ref={femaleInputRef}
                type="file"
                accept=".png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "female")}
              />
              <div className="flex items-center gap-3 mt-1">
                {form.avatar_female_url ? (
                  <div className="relative">
                    <img src={form.avatar_female_url} alt="Avatar feminino" className="w-16 h-16 rounded-full object-cover border-2 border-border" />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, avatar_female_url: null })}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs">♀</div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading === "female"}
                  onClick={() => femaleInputRef.current?.click()}
                >
                  <Upload className="h-3 w-3 mr-1" />
                  {uploading === "female" ? "Enviando..." : "Upload"}
                </Button>
              </div>
            </div>

            <Button onClick={handleSave} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLevels;

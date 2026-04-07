import { useState } from "react";
import { useAdminAds, Ad } from "@/hooks/useAds";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Pencil, Megaphone, BarChart3 } from "lucide-react";
import AdMetricsPanel from "@/components/admin/AdMetricsPanel";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const emptyForm = {
  title: "",
  description: "",
  image_url: "",
  video_url: "",
  link_url: "",
  start_date: new Date().toISOString().slice(0, 16),
  end_date: "",
  frequency: 5,
  is_active: true,
};

const AdminAds = () => {
  const { ads, loading, createAd, updateAd, deleteAd } = useAdminAds();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (ad: Ad) => {
    setEditingId(ad.id);
    setForm({
      title: ad.title,
      description: ad.description,
      image_url: ad.image_url ?? "",
      video_url: (ad as any).video_url ?? "",
      link_url: ad.link_url ?? "",
      start_date: ad.start_date ? new Date(ad.start_date).toISOString().slice(0, 16) : "",
      end_date: ad.end_date ? new Date(ad.end_date).toISOString().slice(0, 16) : "",
      frequency: ad.frequency,
      is_active: ad.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title,
      description: form.description,
      image_url: form.image_url || null,
      video_url: form.video_url || null,
      link_url: form.link_url || null,
      start_date: form.start_date ? new Date(form.start_date).toISOString() : new Date().toISOString(),
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
      frequency: form.frequency,
      is_active: form.is_active,
    };

    const error = editingId
      ? await updateAd(editingId, payload)
      : await createAd(payload);

    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar anúncio");
    } else {
      toast.success(editingId ? "Anúncio atualizado" : "Anúncio criado");
      setDialogOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const error = await deleteAd(deleteId);
    if (error) toast.error("Erro ao excluir");
    else toast.success("Anúncio excluído");
    setDeleteId(null);
  };

  const toggleActive = async (ad: Ad) => {
    await updateAd(ad.id, { is_active: !ad.is_active });
    toast.success(ad.is_active ? "Anúncio desativado" : "Anúncio ativado");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Anúncios</h2>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Novo Anúncio
        </Button>
      </div>

      {ads.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">Nenhum anúncio cadastrado.</p>
      ) : (
        <div className="grid gap-4">
          {ads.map((ad) => (
            <Card key={ad.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{ad.title}</span>
                      <Badge variant={ad.is_active ? "default" : "secondary"} className="text-[10px]">
                        {ad.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    {ad.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{ad.description}</p>
                    )}
                    <div className="flex gap-3 text-[11px] text-muted-foreground">
                      <span>Frequência: a cada {ad.frequency} posts</span>
                      {ad.end_date && (
                        <span>Até: {new Date(ad.end_date).toLocaleDateString("pt-BR")}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch checked={ad.is_active} onCheckedChange={() => toggleActive(ad)} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(ad)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(ad.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Metrics */}
      {ads.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold">Métricas</h3>
          </div>
          <AdMetricsPanel />
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Anúncio" : "Novo Anúncio"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div>
              <Label>URL da Imagem</Label>
              <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label>URL do Vídeo</Label>
              <Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://... (MP4, WebM)" />
              <p className="text-[11px] text-muted-foreground mt-1">Se preenchido, o vídeo será exibido no lugar da imagem</p>
            </div>
            <div>
              <Label>Link (CTA)</Label>
              <Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data Início</Label>
                <Input type="datetime-local" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div>
                <Label>Data Fim (opcional)</Label>
                <Input type="datetime-local" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Frequência (a cada N posts)</Label>
              <Input type="number" min={1} value={form.frequency} onChange={(e) => setForm({ ...form, frequency: parseInt(e.target.value) || 5 })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir anúncio?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminAds;

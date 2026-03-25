import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, ShieldBan, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ReservedUsername {
  id: string;
  username: string;
  descricao: string;
  ativo: boolean;
  created_at: string;
}

const USERNAME_REGEX = /^[a-zA-Z0-9._]{3,20}$/;

const AdminReservedUsernames = () => {
  const [items, setItems] = useState<ReservedUsername[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<ReservedUsername | null>(null);
  const [form, setForm] = useState({ username: "", descricao: "" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("reserved_usernames" as any)
      .select("*")
      .order("username");
    setItems((data as any as ReservedUsername[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ username: "", descricao: "" });
    setDialogOpen(true);
  };

  const openEdit = (item: ReservedUsername) => {
    setEditing(item);
    setForm({ username: item.username, descricao: item.descricao || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const uname = form.username.toLowerCase().trim();
    if (!USERNAME_REGEX.test(uname)) {
      toast({ title: "Formato inválido", description: "3-20 caracteres: letras, números, ponto ou underline.", variant: "destructive" });
      return;
    }
    setSaving(true);
    if (editing) {
      const { error } = await supabase
        .from("reserved_usernames" as any)
        .update({ username: uname, descricao: form.descricao } as any)
        .eq("id", editing.id);
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Atualizado!" });
      }
    } else {
      const { error } = await supabase
        .from("reserved_usernames" as any)
        .insert({ username: uname, descricao: form.descricao } as any);
      if (error) {
        toast({ title: "Erro", description: error.message.includes("duplicate") ? "Esse username já está na lista." : error.message, variant: "destructive" });
      } else {
        toast({ title: "Adicionado!" });
      }
    }
    setSaving(false);
    setDialogOpen(false);
    fetchItems();
  };

  const toggleAtivo = async (item: ReservedUsername) => {
    await supabase
      .from("reserved_usernames" as any)
      .update({ ativo: !item.ativo } as any)
      .eq("id", item.id);
    fetchItems();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("reserved_usernames" as any).delete().eq("id", deleteId);
    setDeleteId(null);
    fetchItems();
    toast({ title: "Removido!" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldBan className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Usernames Reservados</h1>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" /> Adicionar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Nomes de usuário bloqueados ou reservados ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum username reservado ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono">@{item.username}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {item.descricao || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.ativo}
                          onCheckedChange={() => toggleAtivo(item)}
                        />
                        <Badge variant={item.ativo ? "default" : "secondary"}>
                          {item.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteId(item.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar" : "Adicionar"} Username Reservado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                value={form.username}
                onChange={(e) =>
                  setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, "").slice(0, 20) })
                }
                placeholder="ex: admin"
                maxLength={20}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Input
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Motivo da reserva"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja remover este username reservado? Ele ficará disponível para uso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminReservedUsernames;

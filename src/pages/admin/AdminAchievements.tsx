import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon_emoji: string;
  category: string;
  condition_type: string;
  condition_value: number;
}

const emptyForm = {
  key: "",
  name: "",
  description: "",
  icon_emoji: "🏆",
  category: "geral",
  condition_type: "xp",
  condition_value: 0,
};

const conditionLabels: Record<string, string> = {
  xp: "⭐ XP",
  streak: "🔥 Streak",
  correct_answers: "🎯 Acertos",
};

const AdminAchievements = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Achievement[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const fetchItems = async () => {
    const { data } = await supabase.from("achievements").select("*").order("condition_type").order("condition_value");
    setItems((data as Achievement[]) ?? []);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    if (!form.name.trim() || !form.key.trim()) {
      toast({ title: "Preencha nome e chave", variant: "destructive" });
      return;
    }

    const payload = { ...form };

    if (editingId) {
      const { error } = await supabase.from("achievements").update(payload).eq("id", editingId);
      if (error) { toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Conquista atualizada!" });
    } else {
      const { error } = await supabase.from("achievements").insert(payload);
      if (error) { toast({ title: "Erro ao criar", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Conquista criada!" });
    }

    setForm(emptyForm);
    setEditingId(null);
    setOpen(false);
    fetchItems();
  };

  const handleEdit = (ach: Achievement) => {
    setForm({
      key: ach.key,
      name: ach.name,
      description: ach.description,
      icon_emoji: ach.icon_emoji,
      category: ach.category,
      condition_type: ach.condition_type,
      condition_value: ach.condition_value,
    });
    setEditingId(ach.id);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("achievements").delete().eq("id", id);
    if (!error) {
      toast({ title: "Conquista excluída" });
      fetchItems();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Conquistas</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(emptyForm); setEditingId(null); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Nova Conquista</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Conquista" : "Nova Conquista"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-3">
                  <Label>Nome</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Dedicado" />
                </div>
                <div>
                  <Label>Emoji</Label>
                  <Input value={form.icon_emoji} onChange={(e) => setForm({ ...form, icon_emoji: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Chave única</Label>
                <Input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="Ex: streak_7" />
              </div>
              <div>
                <Label>Descrição</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex: 7 dias seguidos de estudo" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo de condição</Label>
                  <Select value={form.condition_type} onValueChange={(v) => setForm({ ...form, condition_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xp">XP</SelectItem>
                      <SelectItem value="streak">Streak</SelectItem>
                      <SelectItem value="correct_answers">Acertos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valor necessário</Label>
                  <Input type="number" value={form.condition_value} onChange={(e) => setForm({ ...form, condition_value: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <Label>Categoria</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex: streak, xp, correct_answers" />
              </div>
              <Button onClick={handleSave} className="w-full">{editingId ? "Salvar" : "Criar Conquista"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Conquista</TableHead>
                <TableHead>Chave</TableHead>
                <TableHead>Condição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((ach) => (
                <TableRow key={ach.id}>
                  <TableCell>
                    <span className="mr-2">{ach.icon_emoji}</span>
                    {ach.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">{ach.key}</TableCell>
                  <TableCell>{conditionLabels[ach.condition_type] ?? ach.condition_type}</TableCell>
                  <TableCell>{ach.condition_value}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(ach)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(ach.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhuma conquista cadastrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAchievements;

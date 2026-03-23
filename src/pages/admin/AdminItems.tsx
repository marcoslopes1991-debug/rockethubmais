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

interface Item {
  id: string;
  name: string;
  description: string;
  category: string;
  icon_emoji: string;
  required_xp: number;
  required_level: number;
}

const emptyForm = {
  name: "",
  description: "",
  category: "roupa",
  icon_emoji: "🎁",
  required_xp: 0,
  required_level: 0,
};

const AdminItems = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const fetchItems = async () => {
    const { data } = await supabase.from("items").select("*").order("required_xp");
    setItems(data ?? []);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    if (!form.name.trim()) return;

    if (editingId) {
      const { error } = await supabase.from("items").update(form).eq("id", editingId);
      if (error) { toast({ title: "Erro ao atualizar", variant: "destructive" }); return; }
      toast({ title: "Item atualizado!" });
    } else {
      const { error } = await supabase.from("items").insert(form);
      if (error) { toast({ title: "Erro ao criar", variant: "destructive" }); return; }
      toast({ title: "Item criado!" });
    }

    setForm(emptyForm);
    setEditingId(null);
    setOpen(false);
    fetchItems();
  };

  const handleEdit = (item: Item) => {
    setForm({
      name: item.name,
      description: item.description,
      category: item.category,
      icon_emoji: item.icon_emoji,
      required_xp: item.required_xp,
      required_level: item.required_level,
    });
    setEditingId(item.id);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (!error) {
      toast({ title: "Item excluído" });
      fetchItems();
    }
  };

  const categoryLabels: Record<string, string> = {
    roupa: "👔 Roupa",
    acessorio: "💍 Acessório",
    equipamento: "🛠️ Equipamento",
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Itens</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(emptyForm); setEditingId(null); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Novo Item</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Item" : "Novo Item"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-3"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Emoji</Label><Input value={form.icon_emoji} onChange={(e) => setForm({ ...form, icon_emoji: e.target.value })} /></div>
              </div>
              <div><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div>
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="roupa">Roupa</SelectItem>
                    <SelectItem value="acessorio">Acessório</SelectItem>
                    <SelectItem value="equipamento">Equipamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>XP Necessário</Label><Input type="number" value={form.required_xp} onChange={(e) => setForm({ ...form, required_xp: Number(e.target.value) })} /></div>
                <div><Label>Nível Necessário</Label><Input type="number" value={form.required_level} onChange={(e) => setForm({ ...form, required_level: Number(e.target.value) })} /></div>
              </div>
              <Button onClick={handleSave} className="w-full">{editingId ? "Salvar" : "Criar Item"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>XP Req.</TableHead>
                <TableHead>Nível Req.</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <span className="mr-2">{item.icon_emoji}</span>
                    {item.name}
                  </TableCell>
                  <TableCell>{categoryLabels[item.category] ?? item.category}</TableCell>
                  <TableCell>{item.required_xp}</TableCell>
                  <TableCell>{item.required_level}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum item cadastrado
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

export default AdminItems;

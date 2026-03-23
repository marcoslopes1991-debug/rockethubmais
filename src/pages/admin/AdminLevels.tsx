import { useState } from "react";
import { useLevels, DbLevel } from "@/hooks/useLevels";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Pencil } from "lucide-react";

const AdminLevels = () => {
  const { levels, loading, refetch } = useLevels();
  const { toast } = useToast();
  const [editing, setEditing] = useState<DbLevel | null>(null);
  const [form, setForm] = useState({ name: "", min_xp: 0, description: "" });

  const handleEdit = (level: DbLevel) => {
    setEditing(level);
    setForm({ name: level.name, min_xp: level.min_xp, description: level.description });
  };

  const handleSave = async () => {
    if (!editing) return;
    const { error } = await supabase
      .from("levels")
      .update({ name: form.name, min_xp: form.min_xp, description: form.description })
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
        <DialogContent>
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
            <Button onClick={handleSave} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLevels;

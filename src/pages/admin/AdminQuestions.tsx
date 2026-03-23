import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string;
  xp_reward: number;
  category: string;
  difficulty: string;
}

const emptyForm: Omit<Question, "id"> = {
  question: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_option: "a",
  explanation: "",
  xp_reward: 10,
  category: "geral",
  difficulty: "medium",
};

const AdminQuestions = () => {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const fetchQuestions = async () => {
    const { data } = await supabase.from("questions").select("*").order("created_at", { ascending: false });
    setQuestions((data as Question[]) ?? []);
  };

  useEffect(() => { fetchQuestions(); }, []);

  const handleSave = async () => {
    if (!form.question.trim()) return;

    if (editingId) {
      const { error } = await supabase.from("questions").update(form).eq("id", editingId);
      if (error) { toast({ title: "Erro ao atualizar", variant: "destructive" }); return; }
      toast({ title: "Pergunta atualizada!" });
    } else {
      const { error } = await supabase.from("questions").insert(form);
      if (error) { toast({ title: "Erro ao criar", variant: "destructive" }); return; }
      toast({ title: "Pergunta criada!" });
    }

    setForm(emptyForm);
    setEditingId(null);
    setOpen(false);
    fetchQuestions();
  };

  const handleEdit = (q: Question) => {
    setForm({
      question: q.question,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_option: q.correct_option,
      explanation: q.explanation,
      xp_reward: q.xp_reward,
      category: q.category,
      difficulty: q.difficulty,
    });
    setEditingId(q.id);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (!error) {
      toast({ title: "Pergunta excluída" });
      fetchQuestions();
    }
  };

  const difficultyLabels: Record<string, string> = {
    easy: "Fácil",
    medium: "Médio",
    hard: "Difícil",
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Perguntas</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(emptyForm); setEditingId(null); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Nova Pergunta</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Pergunta" : "Nova Pergunta"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Pergunta</Label>
                <Textarea value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Opção A</Label><Input value={form.option_a} onChange={(e) => setForm({ ...form, option_a: e.target.value })} /></div>
                <div><Label>Opção B</Label><Input value={form.option_b} onChange={(e) => setForm({ ...form, option_b: e.target.value })} /></div>
                <div><Label>Opção C</Label><Input value={form.option_c} onChange={(e) => setForm({ ...form, option_c: e.target.value })} /></div>
                <div><Label>Opção D</Label><Input value={form.option_d} onChange={(e) => setForm({ ...form, option_d: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Resposta Correta</Label>
                  <Select value={form.correct_option} onValueChange={(v) => setForm({ ...form, correct_option: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a">A</SelectItem>
                      <SelectItem value="b">B</SelectItem>
                      <SelectItem value="c">C</SelectItem>
                      <SelectItem value="d">D</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </div>
                <div>
                  <Label>Dificuldade</Label>
                  <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Fácil</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="hard">Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>XP de Recompensa</Label>
                <Input type="number" value={form.xp_reward} onChange={(e) => setForm({ ...form, xp_reward: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Explicação</Label>
                <Textarea value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} />
              </div>
              <Button onClick={handleSave} className="w-full">{editingId ? "Salvar Alterações" : "Criar Pergunta"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pergunta</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Dificuldade</TableHead>
                <TableHead>XP</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="max-w-xs truncate">{q.question}</TableCell>
                  <TableCell>{q.category}</TableCell>
                  <TableCell>{difficultyLabels[q.difficulty] ?? q.difficulty}</TableCell>
                  <TableCell>{q.xp_reward}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(q)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(q.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {questions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhuma pergunta cadastrada
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

export default AdminQuestions;

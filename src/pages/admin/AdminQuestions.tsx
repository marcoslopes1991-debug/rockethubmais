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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Clock, CalendarClock } from "lucide-react";
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
  mission_type: string;
  available_from: string | null;
  available_until: string | null;
  is_active: boolean;
}

interface QuestionForm {
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
  mission_type: string;
  available_from: string | null;
  available_until: string | null;
  is_active: boolean;
}

const emptyForm: QuestionForm = {
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
  mission_type: "daily",
  available_from: null,
  available_until: null,
  is_active: true,
};

const difficultyLabels: Record<string, string> = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
};

const missionTypeLabels: Record<string, { label: string; icon: string }> = {
  daily: { label: "Diária", icon: "📋" },
  extra: { label: "Extra", icon: "📝" },
  special: { label: "Especial", icon: "⭐" },
};

const AdminQuestions = () => {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [form, setForm] = useState<QuestionForm>(emptyForm);
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
      mission_type: q.mission_type,
      available_from: q.available_from,
      available_until: q.available_until,
      is_active: q.is_active,
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

  const handleToggleActive = async (q: Question) => {
    const { error } = await supabase
      .from("questions")
      .update({ is_active: !q.is_active })
      .eq("id", q.id);
    if (!error) {
      fetchQuestions();
      toast({ title: q.is_active ? "Missão desativada" : "Missão ativada" });
    }
  };

  const getScheduleStatus = (q: Question) => {
    if (!q.is_active) return { label: "Inativa", variant: "secondary" as const };
    const now = new Date().toISOString();
    if (q.available_from && q.available_from > now) return { label: "Agendada", variant: "outline" as const };
    if (q.available_until && q.available_until < now) return { label: "Expirada", variant: "secondary" as const };
    return { label: "Ativa", variant: "default" as const };
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo de Missão</Label>
                  <Select value={form.mission_type} onValueChange={(v) => setForm({ ...form, mission_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">📋 Diária</SelectItem>
                      <SelectItem value="extra">📝 Extra</SelectItem>
                      <SelectItem value="special">⭐ Especial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>XP de Recompensa</Label>
                  <Input type="number" value={form.xp_reward} onChange={(e) => setForm({ ...form, xp_reward: Number(e.target.value) })} />
                </div>
              </div>

              {/* Scheduling section */}
              <div className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  Agendamento
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Data de liberação</Label>
                    <Input
                      type="datetime-local"
                      value={form.available_from ?? ""}
                      onChange={(e) => setForm({ ...form, available_from: e.target.value || null })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {form.mission_type === "extra" ? "Disponível permanentemente após esta data" : "Visível a partir desta data"}
                    </p>
                  </div>
                  <div>
                    <Label>Data de expiração {form.mission_type === "extra" && "(opcional)"}</Label>
                    <Input
                      type="datetime-local"
                      value={form.available_until ?? ""}
                      onChange={(e) => setForm({ ...form, available_until: e.target.value || null })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {form.mission_type === "special" ? "Missão expira após esta data" : "Deixe vazio para sem expiração"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                  />
                  <Label>Missão ativa</Label>
                  <span className="text-xs text-muted-foreground">
                    {form.is_active ? "Será liberada conforme agendamento" : "Não aparecerá para os usuários"}
                  </span>
                </div>
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
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Dificuldade</TableHead>
                <TableHead>XP</TableHead>
                <TableHead className="w-28">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((q) => {
                const status = getScheduleStatus(q);
                const mt = missionTypeLabels[q.mission_type] ?? { label: q.mission_type, icon: "📋" };
                return (
                  <TableRow key={q.id} className={!q.is_active ? "opacity-50" : ""}>
                    <TableCell className="max-w-xs truncate">{q.question}</TableCell>
                    <TableCell>{mt.icon} {mt.label}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>{q.category}</TableCell>
                    <TableCell>{difficultyLabels[q.difficulty] ?? q.difficulty}</TableCell>
                    <TableCell>{q.xp_reward}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleToggleActive(q)} title={q.is_active ? "Desativar" : "Ativar"}>
                          <Clock className={`h-4 w-4 ${q.is_active ? "text-primary" : "text-muted-foreground"}`} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(q)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(q.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {questions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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

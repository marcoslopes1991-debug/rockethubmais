import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Save, Plus, Trash2, BookOpen, Layers, MessageSquare } from "lucide-react";

interface ConfigItem {
  id: string;
  name: string;
  active: boolean;
}

const AdminOnboarding = () => {
  // Modules
  const [modules, setModules] = useState<ConfigItem[]>([]);
  const [newModule, setNewModule] = useState("");

  // Courses
  const [courses, setCourses] = useState<ConfigItem[]>([]);
  const [newCourse, setNewCourse] = useState("");

  // Welcome message
  const [configId, setConfigId] = useState<string | null>(null);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchModules();
    fetchCourses();
    supabase
      .from("ai_config" as any)
      .select("id, welcome_message")
      .limit(1)
      .single()
      .then(({ data }: any) => {
        if (data) {
          setConfigId(data.id);
          setWelcomeMessage(data.welcome_message || "");
        }
      });
  }, []);

  const fetchModules = async () => {
    const { data } = await supabase.from("onboarding_modules").select("*").order("created_at");
    if (data) setModules(data as any);
  };

  const fetchCourses = async () => {
    const { data } = await supabase.from("onboarding_courses").select("*").order("created_at");
    if (data) setCourses(data as any);
  };

  const addModule = async () => {
    if (!newModule.trim()) return;
    const { error } = await supabase.from("onboarding_modules").insert({ name: newModule.trim() } as any);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    setNewModule("");
    fetchModules();
    toast({ title: "Módulo adicionado!" });
  };

  const toggleModule = async (id: string, active: boolean) => {
    await supabase.from("onboarding_modules").update({ active } as any).eq("id", id);
    fetchModules();
  };

  const deleteModule = async (id: string) => {
    await supabase.from("onboarding_modules").delete().eq("id", id);
    fetchModules();
    toast({ title: "Módulo removido" });
  };

  const addCourse = async () => {
    if (!newCourse.trim()) return;
    const { error } = await supabase.from("onboarding_courses").insert({ name: newCourse.trim() } as any);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    setNewCourse("");
    fetchCourses();
    toast({ title: "Curso adicionado!" });
  };

  const toggleCourse = async (id: string, active: boolean) => {
    await supabase.from("onboarding_courses").update({ active } as any).eq("id", id);
    fetchCourses();
  };

  const deleteCourse = async (id: string) => {
    await supabase.from("onboarding_courses").delete().eq("id", id);
    fetchCourses();
    toast({ title: "Curso removido" });
  };

  const saveWelcome = async () => {
    if (!configId) return;
    setSaving(true);
    const { error } = await supabase
      .from("ai_config" as any)
      .update({ welcome_message: welcomeMessage, updated_at: new Date().toISOString() } as any)
      .eq("id", configId);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else toast({ title: "Mensagem salva!" });
    setSaving(false);
  };

  const ItemTable = ({
    items, onToggle, onDelete,
  }: {
    items: ConfigItem[];
    onToggle: (id: string, active: boolean) => void;
    onDelete: (id: string) => void;
  }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead className="w-24 text-center">Ativo</TableHead>
          <TableHead className="w-16" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell className="text-center">
              <Switch checked={item.active} onCheckedChange={(v) => onToggle(item.id, v)} />
            </TableCell>
            <TableCell>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
        {items.length === 0 && (
          <TableRow>
            <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
              Nenhum item cadastrado
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-display font-bold flex items-center gap-2">
        <Layers className="h-6 w-6 text-primary" />
        Configurações do Onboarding
      </h1>

      {/* Modules */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Módulos de Interesse
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nome do módulo..."
              value={newModule}
              onChange={(e) => setNewModule(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addModule()}
            />
            <Button onClick={addModule}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>
          <ItemTable items={modules} onToggle={toggleModule} onDelete={deleteModule} />
        </CardContent>
      </Card>

      {/* Courses */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Cursos RocketHub
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nome do curso..."
              value={newCourse}
              onChange={(e) => setNewCourse(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCourse()}
            />
            <Button onClick={addCourse}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>
          <ItemTable items={courses} onToggle={toggleCourse} onDelete={deleteCourse} />
        </CardContent>
      </Card>

      {/* Welcome message */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Mensagem de Boas-vindas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Texto exibido na última etapa do cadastro</Label>
            <Textarea
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              rows={4}
              placeholder="Escreva a mensagem de boas-vindas..."
            />
          </div>
          <Button onClick={saveWelcome} disabled={saving} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Salvando..." : "Salvar mensagem"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOnboarding;

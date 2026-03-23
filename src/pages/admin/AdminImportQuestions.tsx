import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileJson, ClipboardPaste, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RawQuestion {
  pergunta?: string;
  alternativa_a?: string;
  alternativa_b?: string;
  alternativa_c?: string;
  alternativa_d?: string;
  resposta_correta?: string;
  explicacao?: string;
  nivel?: string;
  categoria?: string;
  dificuldade?: string;
  xp?: number | string;
}

interface ValidatedQuestion {
  raw: RawQuestion;
  valid: boolean;
  errors: string[];
  mapped: {
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: string;
    explanation: string;
    nivel: string;
    category: string;
    difficulty: string;
    xp_reward: number;
  } | null;
}

const VALID_CORRECT = ["a", "b", "c", "d"];
const VALID_DIFFICULTY = ["facil", "medio", "dificil", "easy", "medium", "hard"];
const VALID_NIVEL = ["usuario", "key user", "junior", "pleno", "senior"];

const mapDifficulty = (d: string) => {
  const m: Record<string, string> = { facil: "easy", medio: "medium", dificil: "hard", easy: "easy", medium: "medium", hard: "hard" };
  return m[d.toLowerCase()] ?? "medium";
};

const validate = (q: RawQuestion, idx: number): ValidatedQuestion => {
  const errors: string[] = [];
  if (!q.pergunta?.trim()) errors.push("pergunta vazia");
  if (!q.alternativa_a?.trim()) errors.push("alternativa_a vazia");
  if (!q.alternativa_b?.trim()) errors.push("alternativa_b vazia");
  if (!q.alternativa_c?.trim()) errors.push("alternativa_c vazia");
  if (!q.alternativa_d?.trim()) errors.push("alternativa_d vazia");

  const correct = String(q.resposta_correta ?? "").toLowerCase().trim();
  if (!VALID_CORRECT.includes(correct)) errors.push(`resposta_correta inválida: "${q.resposta_correta}"`);

  const diff = String(q.dificuldade ?? "").toLowerCase().trim();
  if (diff && !VALID_DIFFICULTY.includes(diff)) errors.push(`dificuldade inválida: "${q.dificuldade}"`);

  const nivel = String(q.nivel ?? "usuario").toLowerCase().trim();
  if (!VALID_NIVEL.includes(nivel)) errors.push(`nivel inválido: "${q.nivel}"`);

  const xp = Number(q.xp);
  if (q.xp !== undefined && q.xp !== "" && (isNaN(xp) || xp < 0)) errors.push(`xp inválido: "${q.xp}"`);

  const valid = errors.length === 0;
  return {
    raw: q,
    valid,
    errors,
    mapped: valid
      ? {
          question: q.pergunta!.trim(),
          option_a: q.alternativa_a!.trim(),
          option_b: q.alternativa_b!.trim(),
          option_c: q.alternativa_c!.trim(),
          option_d: q.alternativa_d!.trim(),
          correct_option: correct,
          explanation: (q.explicacao ?? "").trim(),
          nivel,
          category: (q.categoria ?? "geral").trim(),
          difficulty: mapDifficulty(diff || "medium"),
          xp_reward: isNaN(xp) || q.xp === undefined || q.xp === "" ? 10 : xp,
        }
      : null,
  };
};

const parseCSV = (text: string): RawQuestion[] => {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
  return lines.slice(1).map((line) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; continue; }
      if (char === "," && !inQuotes) { values.push(current.trim()); current = ""; continue; }
      current += char;
    }
    values.push(current.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = values[i] ?? ""; });
    return obj as unknown as RawQuestion;
  });
};

const parseBulkText = (text: string): RawQuestion[] => {
  const blocks = text.split(/\n{2,}/).filter((b) => b.trim());
  const questions: RawQuestion[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const q: Record<string, string> = {};

    for (const line of lines) {
      const match = line.match(/^(.+?):\s*(.+)$/);
      if (!match) {
        if (!q.pergunta) q.pergunta = line;
        continue;
      }
      const [, key, value] = match;
      const k = key.toLowerCase().trim();
      const map: Record<string, string> = {
        pergunta: "pergunta", questão: "pergunta", questao: "pergunta", question: "pergunta",
        alternativa_a: "alternativa_a", "alternativa a": "alternativa_a", a: "alternativa_a", "opção a": "alternativa_a", "opcao a": "alternativa_a",
        alternativa_b: "alternativa_b", "alternativa b": "alternativa_b", b: "alternativa_b", "opção b": "alternativa_b", "opcao b": "alternativa_b",
        alternativa_c: "alternativa_c", "alternativa c": "alternativa_c", c: "alternativa_c", "opção c": "alternativa_c", "opcao c": "alternativa_c",
        alternativa_d: "alternativa_d", "alternativa d": "alternativa_d", d: "alternativa_d", "opção d": "alternativa_d", "opcao d": "alternativa_d",
        resposta_correta: "resposta_correta", resposta: "resposta_correta", correta: "resposta_correta", correct: "resposta_correta",
        explicacao: "explicacao", explicação: "explicacao", explanation: "explicacao",
        nivel: "nivel", nível: "nivel", level: "nivel",
        categoria: "categoria", category: "categoria",
        dificuldade: "dificuldade", difficulty: "dificuldade",
        xp: "xp", pontos: "xp",
      };
      const mapped = map[k];
      if (mapped) q[mapped] = value.trim();
    }

    if (q.pergunta) questions.push(q as unknown as RawQuestion);
  }
  return questions;
};

const AdminImportQuestions = () => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<ValidatedQuestion[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
  const [bulkText, setBulkText] = useState("");

  const handleParse = () => {
    if (!bulkText.trim()) return;
    setResult(null);
    setFileName("");
    const raw = parseBulkText(bulkText);
    if (raw.length === 0) {
      toast({ title: "Nenhuma pergunta encontrada no texto", variant: "destructive" });
      return;
    }
    setItems(raw.map((q, i) => validate(q, i)));
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setFileName(file.name);
    const text = await file.text();

    let raw: RawQuestion[] = [];
    if (file.name.endsWith(".json")) {
      try {
        const parsed = JSON.parse(text);
        raw = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        toast({ title: "JSON inválido", variant: "destructive" });
        return;
      }
    } else {
      raw = parseCSV(text);
    }

    if (raw.length === 0) {
      toast({ title: "Nenhuma pergunta encontrada no arquivo", variant: "destructive" });
      return;
    }

    setItems(raw.map((q, i) => validate(q, i)));
  };

  const handleImport = async () => {
    const valid = items.filter((i) => i.valid && i.mapped);
    if (valid.length === 0) return;

    setImporting(true);
    const { error } = await supabase.from("questions").insert(valid.map((v) => v.mapped!));

    setImporting(false);
    if (error) {
      toast({ title: "Erro na importação", description: error.message, variant: "destructive" });
      return;
    }

    const failed = items.length - valid.length;
    setResult({ success: valid.length, failed });
    toast({ title: `${valid.length} perguntas importadas com sucesso!` });
    setItems([]);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const validCount = items.filter((i) => i.valid).length;
  const invalidCount = items.length - validCount;

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-display font-bold">Importar Perguntas</h1>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-5 w-5" /> Upload de Arquivo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Aceita arquivos <strong>.json</strong> ou <strong>.csv</strong> com os campos:
            pergunta, alternativa_a, alternativa_b, alternativa_c, alternativa_d,
            resposta_correta (a/b/c/d), explicacao, nivel, categoria, dificuldade, xp
          </p>
          <div className="flex gap-3 items-center">
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <FileJson className="h-4 w-4 mr-1" /> Selecionar Arquivo
            </Button>
            <input ref={fileRef} type="file" accept=".json,.csv" className="hidden" onChange={handleFile} />
            {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <span className="font-medium">{result.success} importadas com sucesso</span>
            {result.failed > 0 && (
              <span className="text-muted-foreground">• {result.failed} ignoradas por erro</span>
            )}
          </CardContent>
        </Card>
      )}

      {items.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <Badge variant="default">{validCount} válidas</Badge>
              {invalidCount > 0 && <Badge variant="destructive">{invalidCount} com erros</Badge>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setItems([]); setFileName(""); if (fileRef.current) fileRef.current.value = ""; }}>
                Cancelar
              </Button>
              <Button onClick={handleImport} disabled={validCount === 0 || importing}>
                {importing ? "Importando..." : `Importar ${validCount} perguntas`}
              </Button>
            </div>
          </div>

          <Card className="glass-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pergunta</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Dificuldade</TableHead>
                    <TableHead>XP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={idx} className={!item.valid ? "bg-destructive/5" : ""}>
                      <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell>
                        {item.valid ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <div className="flex items-center gap-1">
                            <XCircle className="h-4 w-4 text-destructive" />
                            <span className="text-xs text-destructive">{item.errors.join(", ")}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{item.raw.pergunta ?? "—"}</TableCell>
                      <TableCell>{item.raw.nivel ?? "—"}</TableCell>
                      <TableCell>{item.raw.categoria ?? "—"}</TableCell>
                      <TableCell>{item.raw.dificuldade ?? "—"}</TableCell>
                      <TableCell>{item.raw.xp ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AdminImportQuestions;

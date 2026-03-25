import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileJson, ClipboardPaste, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLevels } from "@/hooks/useLevels";
import LevelReferencePanel from "@/components/admin/LevelReferencePanel";
import {
  type RawQuestion,
  type ValidatedQuestion,
  validate,
  parseCSV,
  parseBulkText,
} from "@/lib/importQuestionUtils";

const AdminImportQuestions = () => {
  const { toast } = useToast();
  const { levels, loading: levelsLoading } = useLevels();
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
    setItems(raw.map((q) => validate(q, levels)));
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

    setItems(raw.map((q) => validate(q, levels)));
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
  const warningCount = items.filter((i) => i.valid && i.warnings.length > 0).length;

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-display font-bold">Importar Perguntas</h1>

      <LevelReferencePanel levels={levels} loading={levelsLoading} />

      <Tabs defaultValue="file" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="file"><Upload className="h-4 w-4 mr-1" /> Upload de Arquivo</TabsTrigger>
          <TabsTrigger value="paste"><ClipboardPaste className="h-4 w-4 mr-1" /> Colar Texto</TabsTrigger>
        </TabsList>

        <TabsContent value="file">
          <Card className="glass-card">
            <CardContent className="space-y-4 pt-6">
              <p className="text-sm text-muted-foreground">
                Aceita arquivos <strong>.json</strong> ou <strong>.csv</strong> com os campos:
                pergunta, alternativa_a, alternativa_b, alternativa_c, alternativa_d,
                resposta_correta (a/b/c/d), explicacao, <strong>nivel_id</strong> (inteiro) ou nivel (nome), categoria, dificuldade, xp
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
        </TabsContent>

        <TabsContent value="paste">
          <Card className="glass-card">
            <CardContent className="space-y-4 pt-6">
              <p className="text-sm text-muted-foreground">
                Cole múltiplas perguntas separadas por <strong>linha em branco</strong>. Use <code className="text-xs bg-muted px-1 rounded">nivel_id</code> (inteiro) ou <code className="text-xs bg-muted px-1 rounded">nivel</code> (nome).
              </p>
              <pre className="text-xs bg-muted/50 p-3 rounded-md text-muted-foreground whitespace-pre-wrap">
{`Pergunta: Qual é a transação para criar ordem de venda?
A: VA01
B: VA02
C: VA03
D: MM01
Resposta: a
Explicação: VA01 é a transação padrão...
Categoria: vendas
Dificuldade: facil
Nivel_id: 1
XP: 10`}
              </pre>
              <Textarea
                placeholder="Cole suas perguntas aqui..."
                className="min-h-[200px] font-mono text-sm"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
              />
              <Button onClick={handleParse} disabled={!bulkText.trim()}>
                <ClipboardPaste className="h-4 w-4 mr-1" /> Processar Texto
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
              {warningCount > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <AlertTriangle className="h-3 w-3" /> {warningCount} com avisos
                </Badge>
              )}
              {invalidCount > 0 && <Badge variant="destructive">{invalidCount} com erros</Badge>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setItems([]); setFileName(""); setBulkText(""); if (fileRef.current) fileRef.current.value = ""; }}>
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
                    <TableRow key={idx} className={!item.valid ? "bg-destructive/5" : item.warnings.length > 0 ? "bg-accent/10" : ""}>
                      <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell>
                        {item.valid && item.warnings.length === 0 ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : item.valid && item.warnings.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <span className="text-xs text-amber-600">{item.warnings.join(", ")}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <XCircle className="h-4 w-4 text-destructive" />
                            <span className="text-xs text-destructive">{item.errors.join(", ")}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{item.raw.pergunta ?? "—"}</TableCell>
                      <TableCell>
                        {item.raw.nivel_id ? (
                          <span className="font-mono text-xs">ID: {item.raw.nivel_id}</span>
                        ) : (
                          item.raw.nivel ?? "—"
                        )}
                      </TableCell>
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

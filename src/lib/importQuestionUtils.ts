import type { DbLevel } from "@/hooks/useLevels";

export interface RawQuestion {
  pergunta?: string;
  alternativa_a?: string;
  alternativa_b?: string;
  alternativa_c?: string;
  alternativa_d?: string;
  resposta_correta?: string;
  explicacao?: string;
  nivel?: string;
  nivel_id?: number | string;
  categoria?: string;
  dificuldade?: string;
  xp?: number | string;
}

export interface MappedQuestion {
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
}

export interface ValidatedQuestion {
  raw: RawQuestion;
  valid: boolean;
  errors: string[];
  warnings: string[];
  mapped: MappedQuestion | null;
}

const VALID_CORRECT = ["a", "b", "c", "d"];
const VALID_DIFFICULTY = ["facil", "medio", "dificil", "easy", "medium", "hard"];

const mapDifficulty = (d: string) => {
  const m: Record<string, string> = { facil: "easy", medio: "medium", dificil: "hard", easy: "easy", medium: "medium", hard: "hard" };
  return m[d.toLowerCase()] ?? "medium";
};

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function findClosestLevel(name: string, levels: DbLevel[]): DbLevel | null {
  const norm = normalize(name);
  // exact match
  const exact = levels.find((l) => normalize(l.name) === norm);
  if (exact) return exact;
  // partial match
  const partial = levels.find((l) => normalize(l.name).includes(norm) || norm.includes(normalize(l.name)));
  return partial ?? null;
}

export function resolveNivel(
  raw: RawQuestion,
  levels: DbLevel[]
): { nivel: string; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1) nivel_id takes priority
  if (raw.nivel_id !== undefined && raw.nivel_id !== "") {
    const id = Number(raw.nivel_id);
    if (isNaN(id)) {
      errors.push(`nivel_id inválido: "${raw.nivel_id}"`);
      return { nivel: "", errors, warnings };
    }
    const found = levels.find((l) => l.level_number === id);
    if (!found) {
      errors.push(`nivel_id ${id} não existe. IDs válidos: ${levels.map((l) => l.level_number).join(", ")}`);
      return { nivel: "", errors, warnings };
    }
    return { nivel: normalize(found.name), errors, warnings };
  }

  // 2) fallback to nivel name
  const name = String(raw.nivel ?? "").trim();
  if (!name) {
    return { nivel: "usuario", errors, warnings };
  }

  const match = findClosestLevel(name, levels);
  if (match) {
    if (normalize(match.name) !== normalize(name)) {
      warnings.push(`"${name}" interpretado como "${match.name}"`);
    }
    return { nivel: normalize(match.name), errors, warnings };
  }

  // No match — try legacy static names
  const LEGACY = ["usuario", "key user", "junior", "pleno", "senior"];
  if (LEGACY.includes(normalize(name))) {
    return { nivel: normalize(name), errors, warnings };
  }

  errors.push(`nível "${name}" não encontrado. Use nivel_id ou um nome cadastrado.`);
  return { nivel: "", errors, warnings };
}

export function validate(q: RawQuestion, levels: DbLevel[]): ValidatedQuestion {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!q.pergunta?.trim()) errors.push("pergunta vazia");
  if (!q.alternativa_a?.trim()) errors.push("alternativa_a vazia");
  if (!q.alternativa_b?.trim()) errors.push("alternativa_b vazia");
  if (!q.alternativa_c?.trim()) errors.push("alternativa_c vazia");
  if (!q.alternativa_d?.trim()) errors.push("alternativa_d vazia");

  const correct = String(q.resposta_correta ?? "").toLowerCase().trim();
  if (!VALID_CORRECT.includes(correct)) errors.push(`resposta_correta inválida: "${q.resposta_correta}"`);

  const diff = String(q.dificuldade ?? "").toLowerCase().trim();
  if (diff && !VALID_DIFFICULTY.includes(diff)) errors.push(`dificuldade inválida: "${q.dificuldade}"`);

  const { nivel, errors: nivelErrors, warnings: nivelWarnings } = resolveNivel(q, levels);
  errors.push(...nivelErrors);
  warnings.push(...nivelWarnings);

  const xp = Number(q.xp);
  if (q.xp !== undefined && q.xp !== "" && (isNaN(xp) || xp < 0)) errors.push(`xp inválido: "${q.xp}"`);

  const valid = errors.length === 0;
  return {
    raw: q,
    valid,
    errors,
    warnings,
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
}

export function parseCSV(text: string): RawQuestion[] {
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
}

export function parseBulkText(text: string): RawQuestion[] {
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
        nivel_id: "nivel_id", "nível_id": "nivel_id", level_id: "nivel_id",
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
}

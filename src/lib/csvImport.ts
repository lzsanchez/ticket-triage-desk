/**
 * Importa CSV exportado pelo GLPI (separador ; ou ,)
 * e converte para os tipos internos do app.
 */
import type { Chamado, Cliente, StatusInterno, Prioridade } from "@/types";

// ─── helpers ─────────────────────────────────────────────────────────────────

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };

  // detectar separador: ; ou ,
  const sep = lines[0].includes(";") ? ";" : ",";

  function splitLine(line: string): string[] {
    const result: string[] = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === sep && !inQuote) { result.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    result.push(cur.trim());
    return result;
  }

  const headers = splitLine(lines[0]);
  const rows = lines.slice(1).map((l) => {
    const vals = splitLine(l);
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""]));
  });
  return { headers, rows };
}

// Mapeamentos de nomes de colunas GLPI (PT + EN)
const COL = {
  id:     ["id"],
  titulo: ["titulo", "title", "titre", "nom", "name"],
  status: ["status", "statut", "estado"],
  prio:   ["prioridade", "priority", "priorite", "priorité"],
  entity: ["entidade", "entity", "entite", "entité", "cliente", "client"],
  cat:    ["categoria", "category", "categorie", "catégorie", "tipo", "type"],
  abertura: ["data de abertura", "opening date", "date d'ouverture", "data abertura", "aberto em", "criado em"],
  modif:  ["ultima atualizacao", "last update", "date de modification", "data modificacao", "atualizado em"],
  tecnico: ["atribuido a - tecnico", "assigned to - technician", "technicien", "tecnico", "technician", "atribuido", "assigned"],
};

function findCol(headers: string[], keys: string[]): string | null {
  for (const h of headers) {
    const hn = norm(h);
    for (const k of keys) {
      if (hn.includes(norm(k))) return h;
    }
  }
  return null;
}

function mapStatus(s: string): StatusInterno {
  const n = norm(s);
  if (n.includes("novo") || n.includes("new")) return "triagem";
  if (n.includes("atribu") || n.includes("assign")) return "em_tratativa";
  if (n.includes("planej") || n.includes("planned")) return "a_fazer_hoje";
  if (n.includes("pendent") || n.includes("waiting")) return "aguardando_terceiro";
  if (n.includes("resolv") || n.includes("solved") || n.includes("fech") || n.includes("closed")) return "concluido";
  return "triagem";
}

function mapPriority(s: string): Prioridade {
  const n = norm(s);
  if (n.includes("muito baixa") || n.includes("very low") || n.includes("baixa") || n.includes("low")) return "baixa";
  if (n.includes("media") || n.includes("medium") || n.includes("normal")) return "media";
  if (n.includes("muito alta") || n.includes("very high") || n.includes("critica") || n.includes("critical")) return "critica";
  if (n.includes("alta") || n.includes("high")) return "alta";
  return "media";
}

function parseDate(s: string): Date {
  if (!s) return new Date();
  // tenta ISO ou "YYYY-MM-DD HH:mm:ss" ou "DD/MM/YYYY HH:mm"
  const d = new Date(s.replace(" ", "T"));
  if (!isNaN(d.getTime())) return d;
  // DD/MM/YYYY
  const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}`);
  return new Date();
}

// ─── export principal ─────────────────────────────────────────────────────────

export type CSVImportResult = {
  chamados: Chamado[];
  clientes: Cliente[];
  warnings: string[];
};

export function parseGLPICSV(text: string): CSVImportResult {
  const { headers, rows } = parseCSV(text);
  const warnings: string[] = [];

  if (!headers.length) {
    return { chamados: [], clientes: [], warnings: ["Arquivo vazio ou formato inválido."] };
  }

  const colId     = findCol(headers, COL.id);
  const colTitulo = findCol(headers, COL.titulo);
  const colStatus = findCol(headers, COL.status);
  const colPrio   = findCol(headers, COL.prio);
  const colEntity = findCol(headers, COL.entity);
  const colCat    = findCol(headers, COL.cat);
  const colAbert  = findCol(headers, COL.abertura);
  const colModif  = findCol(headers, COL.modif);
  const colTec    = findCol(headers, COL.tecnico);

  if (!colId) warnings.push("Coluna 'ID' não encontrada — IDs serão gerados.");
  if (!colTitulo) warnings.push("Coluna de título não encontrada.");

  const entityMap = new Map<string, Cliente>();
  const chamados: Chamado[] = [];

  rows.forEach((row, i) => {
    const rawId     = colId     ? row[colId].trim()     : String(i + 1);
    const rawTitulo = colTitulo ? row[colTitulo].trim() : `Chamado ${rawId}`;
    if (!rawId && !rawTitulo) return;

    const entityName = colEntity ? row[colEntity].trim() : "";
    let clienteId = "0";
    if (entityName) {
      if (!entityMap.has(entityName)) {
        const slug = `csv-${entityName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 40)}`;
        entityMap.set(entityName, { id: slug, nome: entityName, entidadeGLPI: entityName });
      }
      clienteId = entityMap.get(entityName)!.id;
    }

    const categoria = colCat ? (row[colCat].trim() || "Sem categoria") : "Sem categoria";

    chamados.push({
      id: rawId || String(i + 1),
      titulo: rawTitulo || `Chamado ${rawId}`,
      clienteId,
      tipoChamado: { categoria },
      tecnicoId: colTec ? mapTecnico(row[colTec]) : null,
      dataAbertura: parseDate(colAbert ? row[colAbert] : ""),
      dataUltimaAtualizacao: parseDate(colModif ? row[colModif] : ""),
      statusInterno: mapStatus(colStatus ? row[colStatus] : ""),
      prioridade: mapPriority(colPrio ? row[colPrio] : ""),
      verMaisTardeAte: null,
      verMaisTardeMotivo: null,
      projetoId: null,
      observacoesInternas: "",
      historicoMovimentacoes: [],
    });
  });

  return { chamados, clientes: Array.from(entityMap.values()), warnings };
}

const TECNICO_MAP: Record<string, string> = {
  luciano: "luciano",
  pedro: "pedro",
  priscila: "priscila",
};

function mapTecnico(s: string): string | null {
  if (!s) return null;
  const n = norm(s);
  for (const [k, v] of Object.entries(TECNICO_MAP)) {
    if (n.includes(k)) return v;
  }
  return null;
}

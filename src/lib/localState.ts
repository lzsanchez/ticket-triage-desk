/**
 * Persiste no localStorage os campos que não existem no GLPI:
 * statusInterno override, ver mais tarde, projeto, observações, histórico.
 */
import type { Chamado, Movimentacao, StatusInterno, Projeto } from "@/types";

const KEY_CHAMADOS = "ctrldsk.chamados";
const KEY_PROJETOS  = "ctrldsk.projetos";

export type LocalChamadoState = {
  statusOverride?: StatusInterno;
  verMaisTardeAte?: string | null;   // ISO string
  verMaisTardeMotivo?: string | null;
  projetoId?: string | null;
  observacoesInternas?: string;
  movimentacoes?: Movimentacao[];
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded — silenciar
  }
}

// ─── chamados ────────────────────────────────────────────────────────────────

export function getLocalChamados(): Record<string, LocalChamadoState> {
  return load<Record<string, LocalChamadoState>>(KEY_CHAMADOS, {});
}

export function setLocalChamado(id: string, patch: Partial<LocalChamadoState>): void {
  const all = getLocalChamados();
  all[id] = { ...all[id], ...patch };
  save(KEY_CHAMADOS, all);
}

/** Mescla dados GLPI com overrides locais */
export function mergeLocalState(chamados: Chamado[]): Chamado[] {
  const local = getLocalChamados();
  return chamados.map((c) => {
    const ov = local[c.id];
    if (!ov) return c;
    return {
      ...c,
      statusInterno: ov.statusOverride ?? c.statusInterno,
      verMaisTardeAte: ov.verMaisTardeAte ? new Date(ov.verMaisTardeAte) : null,
      verMaisTardeMotivo: ov.verMaisTardeMotivo ?? null,
      projetoId: ov.projetoId ?? null,
      observacoesInternas: ov.observacoesInternas ?? "",
      historicoMovimentacoes: ov.movimentacoes
        ? ov.movimentacoes.map((m) => ({ ...m, data: new Date(m.data) }))
        : c.historicoMovimentacoes,
    };
  });
}

// ─── projetos ────────────────────────────────────────────────────────────────

export function getLocalProjetos(): Projeto[] {
  return load<Projeto[]>(KEY_PROJETOS, []).map((p) => ({
    ...p,
    prazoPrometido: p.prazoPrometido ? new Date(p.prazoPrometido) : null,
    dataCriacao: new Date(p.dataCriacao),
    dataConclusao: p.dataConclusao ? new Date(p.dataConclusao) : undefined,
    ultimaAtualizacaoRegistrada: p.ultimaAtualizacaoRegistrada
      ? new Date(p.ultimaAtualizacaoRegistrada)
      : undefined,
    historico: (p.historico ?? []).map((e) => ({ ...e, data: new Date(e.data) })),
  }));
}

export function saveLocalProjetos(projetos: Projeto[]): void {
  save(KEY_PROJETOS, projetos);
}

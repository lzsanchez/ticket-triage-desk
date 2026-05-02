import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type {
  Chamado,
  Projeto,
  Prioridade,
  StatusInterno,
  Movimentacao,
  TipoMovimentacao,
} from "@/types";
import { mockChamados } from "@/data/mockChamados";
import { mockProjetos } from "@/data/mockProjetos";

type DataContextValue = {
  chamados: Chamado[];
  projetos: Projeto[];
  atribuirTecnico: (chamadoId: string, tecnicoId: string, autorId: string, motivo?: string) => void;
  setPrioridade: (chamadoId: string, prioridade: Prioridade) => void;
  setStatus: (chamadoId: string, status: StatusInterno, autorId: string) => void;
  setSnooze: (chamadoId: string, ate: Date | null, motivo: string, autorId: string) => void;
  adicionarObservacao: (chamadoId: string, texto: string, autorId: string) => void;
  marcarScriptUsado: (chamadoId: string, scriptNome: string, autorId: string) => void;
  vincularProjeto: (chamadoId: string, projetoId: string, autorId: string) => void;
  criarProjeto: (
    projeto: Omit<Projeto, "id" | "dataCriacao" | "chamadosVinculados"> & {
      chamadoIdInicial?: string;
      autorId?: string;
    },
  ) => Projeto;
  concluirTriagem: (chamadoId: string, autorId: string) => void;
};

const DataContext = createContext<DataContextValue | null>(null);

function novaMov(
  chamadoId: string,
  autorId: string,
  tipo: TipoMovimentacao,
  descricao: string,
  motivo?: string,
): Movimentacao {
  return {
    id: `${chamadoId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    data: new Date(),
    usuarioId: autorId,
    tipo,
    descricao,
    motivo,
  };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [chamados, setChamados] = useState<Chamado[]>(mockChamados);
  const [projetos, setProjetos] = useState<Projeto[]>(mockProjetos);

  const updateChamado = useCallback(
    (id: string, patch: Partial<Chamado>, mov?: Movimentacao) => {
      setChamados((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                ...patch,
                dataUltimaAtualizacao: new Date(),
                historicoMovimentacoes: mov
                  ? [...c.historicoMovimentacoes, mov]
                  : c.historicoMovimentacoes,
              }
            : c,
        ),
      );
    },
    [],
  );

  const value = useMemo<DataContextValue>(
    () => ({
      chamados,
      projetos,
      atribuirTecnico: (chamadoId, tecnicoId, autorId) => {
        updateChamado(
          chamadoId,
          { tecnicoId },
          novaMov(chamadoId, autorId, "atribuicao", `Chamado atribuído a ${tecnicoId}.`),
        );
      },
      setPrioridade: (chamadoId, prioridade) => {
        // prioridade não gera entrada no histórico (decisão silenciosa)
        setChamados((prev) =>
          prev.map((c) => (c.id === chamadoId ? { ...c, prioridade } : c)),
        );
      },
      setStatus: (chamadoId, status, autorId) => {
        updateChamado(
          chamadoId,
          { statusInterno: status },
          novaMov(chamadoId, autorId, "mudanca_status", `Status alterado para "${status}".`),
        );
      },
      setSnooze: (chamadoId, ate, motivo, autorId) => {
        const desc = ate
          ? `Chamado em snooze até ${ate.toLocaleString("pt-BR")}.`
          : "Snooze removido.";
        updateChamado(
          chamadoId,
          { snoozeAte: ate, snoozeMotivo: ate ? motivo : null },
          novaMov(chamadoId, autorId, "snooze", desc, ate ? motivo : undefined),
        );
      },
      adicionarObservacao: (chamadoId, texto, autorId) => {
        setChamados((prev) =>
          prev.map((c) => {
            if (c.id !== chamadoId) return c;
            const obs = c.observacoesInternas
              ? `${c.observacoesInternas}\n\n${texto}`
              : texto;
            return {
              ...c,
              observacoesInternas: obs,
              dataUltimaAtualizacao: new Date(),
              historicoMovimentacoes: [
                ...c.historicoMovimentacoes,
                novaMov(chamadoId, autorId, "observacao", texto),
              ],
            };
          }),
        );
      },
      marcarScriptUsado: (chamadoId, scriptNome, autorId) => {
        setChamados((prev) =>
          prev.map((c) =>
            c.id === chamadoId
              ? {
                  ...c,
                  dataUltimaAtualizacao: new Date(),
                  historicoMovimentacoes: [
                    ...c.historicoMovimentacoes,
                    novaMov(
                      chamadoId,
                      autorId,
                      "observacao",
                      `Script aplicado: "${scriptNome}".`,
                    ),
                  ],
                }
              : c,
          ),
        );
      },
      vincularProjeto: (chamadoId, projetoId, autorId) => {
        updateChamado(
          chamadoId,
          { projetoId },
          novaMov(
            chamadoId,
            autorId,
            "vinculacao_projeto",
            `Vinculado ao projeto ${projetoId}.`,
          ),
        );
        setProjetos((prev) =>
          prev.map((p) =>
            p.id === projetoId && !p.chamadosVinculados.includes(chamadoId)
              ? { ...p, chamadosVinculados: [...p.chamadosVinculados, chamadoId] }
              : p,
          ),
        );
      },
      criarProjeto: ({ chamadoIdInicial, autorId, ...dados }) => {
        const novo: Projeto = {
          ...dados,
          id: `proj-${Date.now()}`,
          dataCriacao: new Date(),
          chamadosVinculados: chamadoIdInicial ? [chamadoIdInicial] : [],
        };
        setProjetos((prev) => [...prev, novo]);
        if (chamadoIdInicial) {
          updateChamado(
            chamadoIdInicial,
            { projetoId: novo.id },
            novaMov(
              chamadoIdInicial,
              autorId ?? "luciano",
              "vinculacao_projeto",
              `Vinculado ao novo projeto "${novo.nome}".`,
            ),
          );
        }
        return novo;
      },
      concluirTriagem: (chamadoId, autorId) => {
        updateChamado(
          chamadoId,
          { statusInterno: "a_fazer_hoje" },
          novaMov(chamadoId, autorId, "mudanca_status", `Triagem concluída — enviado para "a fazer hoje".`),
        );
      },
    }),
    [chamados, projetos, updateChamado],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}

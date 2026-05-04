import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type {
  Chamado,
  Projeto,
  Prioridade,
  StatusInterno,
  Movimentacao,
  TipoMovimentacao,
  EventoProjeto,
  TipoEventoProjeto,
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
      chamadosIniciais?: string[];
      autorId?: string;
    },
  ) => Projeto;
  moverEtapaProjeto: (projetoId: string, novaEtapa: string, autorId?: string) => void;
  atualizarProjeto: (projetoId: string, patch: Partial<Projeto>, autorId: string, descricao?: string) => void;
  removerChamadoProjeto: (chamadoId: string, projetoId: string, autorId: string) => void;
  registrarAtualizacaoProjeto: (projetoId: string, texto: string, autorId: string) => void;
  adicionarObservacaoProjeto: (projetoId: string, texto: string, autorId: string) => void;
  arquivarProjeto: (projetoId: string, autorId: string) => void;
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

function novoEvento(
  projetoId: string,
  autorId: string,
  tipo: TipoEventoProjeto,
  descricao: string,
): EventoProjeto {
  return {
    id: `${projetoId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    data: new Date(),
    usuarioId: autorId,
    tipo,
    descricao,
  };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [chamados, setChamados] = useState<Chamado[]>(mockChamados);
  const [projetos, setProjetos] = useState<Projeto[]>(
    mockProjetos.map((p) => ({
      ...p,
      historico: p.historico ?? [
        {
          id: `${p.id}-init`,
          data: p.dataCriacao,
          usuarioId: "luciano",
          tipo: "criacao" as const,
          descricao: `Projeto "${p.nome}" criado.`,
        },
      ],
    })),
  );

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
      atribuirTecnico: (chamadoId, tecnicoId, autorId, motivo) => {
        updateChamado(
          chamadoId,
          { tecnicoId },
          novaMov(
            chamadoId,
            autorId,
            "atribuicao",
            `Chamado atribuído a ${tecnicoId}.`,
            motivo,
          ),
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
              ? {
                  ...p,
                  chamadosVinculados: [...p.chamadosVinculados, chamadoId],
                  historico: [
                    ...(p.historico ?? []),
                    novoEvento(
                      projetoId,
                      autorId,
                      "chamado_adicionado",
                      `Chamado ${chamadoId} adicionado ao projeto.`,
                    ),
                  ],
                }
              : p,
          ),
        );
      },
      criarProjeto: ({ chamadoIdInicial, chamadosIniciais, autorId, ...dados }) => {
        const iniciais = chamadosIniciais ?? (chamadoIdInicial ? [chamadoIdInicial] : []);
        const novo: Projeto = {
          ...dados,
          id: `proj-${Date.now()}`,
          dataCriacao: new Date(),
          chamadosVinculados: iniciais,
          historico: [
            {
              id: `proj-${Date.now()}-init`,
              data: new Date(),
              usuarioId: autorId ?? "luciano",
              tipo: "criacao",
              descricao: `Projeto "${dados.nome}" criado.`,
            },
          ],
        };
        setProjetos((prev) => [...prev, novo]);
        iniciais.forEach((cid) => {
          updateChamado(
            cid,
            { projetoId: novo.id },
            novaMov(
              cid,
              autorId ?? "luciano",
              "vinculacao_projeto",
              `Vinculado ao novo projeto "${novo.nome}".`,
            ),
          );
        });
        return novo;
      },
      moverEtapaProjeto: (projetoId, novaEtapa, autorId = "luciano") => {
        setProjetos((prev) =>
          prev.map((p) => {
            if (p.id !== projetoId) return p;
            if (p.etapaAtual === novaEtapa) return p;
            return {
              ...p,
              etapaAtual: novaEtapa,
              dataConclusao:
                novaEtapa === "Entregue" || novaEtapa === "Concluído"
                  ? p.dataConclusao ?? new Date()
                  : p.dataConclusao,
              historico: [
                ...(p.historico ?? []),
                novoEvento(
                  projetoId,
                  autorId,
                  "mudanca_etapa",
                  `Etapa alterada de "${p.etapaAtual}" para "${novaEtapa}".`,
                ),
              ],
            };
          }),
        );
      },
      atualizarProjeto: (projetoId, patch, autorId, descricao) => {
        setProjetos((prev) =>
          prev.map((p) =>
            p.id === projetoId
              ? {
                  ...p,
                  ...patch,
                  historico: [
                    ...(p.historico ?? []),
                    novoEvento(projetoId, autorId, "edicao", descricao ?? "Projeto editado."),
                  ],
                }
              : p,
          ),
        );
      },
      removerChamadoProjeto: (chamadoId, projetoId, autorId) => {
        setProjetos((prev) =>
          prev.map((p) =>
            p.id === projetoId
              ? {
                  ...p,
                  chamadosVinculados: p.chamadosVinculados.filter((c) => c !== chamadoId),
                  historico: [
                    ...(p.historico ?? []),
                    novoEvento(
                      projetoId,
                      autorId,
                      "chamado_removido",
                      `Chamado ${chamadoId} removido do projeto.`,
                    ),
                  ],
                }
              : p,
          ),
        );
        updateChamado(
          chamadoId,
          { projetoId: null },
          novaMov(chamadoId, autorId, "vinculacao_projeto", `Desvinculado do projeto.`),
        );
      },
      registrarAtualizacaoProjeto: (projetoId, texto, autorId) => {
        setProjetos((prev) =>
          prev.map((p) =>
            p.id === projetoId
              ? {
                  ...p,
                  ultimaAtualizacaoRegistrada: new Date(),
                  historico: [
                    ...(p.historico ?? []),
                    novoEvento(
                      projetoId,
                      autorId,
                      "atualizacao_registrada",
                      texto || "Atualização registrada.",
                    ),
                  ],
                }
              : p,
          ),
        );
      },
      adicionarObservacaoProjeto: (projetoId, texto, autorId) => {
        setProjetos((prev) =>
          prev.map((p) => {
            if (p.id !== projetoId) return p;
            const obs = p.observacoes ? `${p.observacoes}\n\n${texto}` : texto;
            return {
              ...p,
              observacoes: obs,
              historico: [
                ...(p.historico ?? []),
                novoEvento(projetoId, autorId, "observacao", texto),
              ],
            };
          }),
        );
      },
      arquivarProjeto: (projetoId, autorId) => {
        setProjetos((prev) =>
          prev.map((p) =>
            p.id === projetoId
              ? {
                  ...p,
                  arquivado: true,
                  historico: [
                    ...(p.historico ?? []),
                    novoEvento(projetoId, autorId, "edicao", "Projeto arquivado."),
                  ],
                }
              : p,
          ),
        );
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

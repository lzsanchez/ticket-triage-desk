import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  Chamado,
  Cliente,
  Projeto,
  Prioridade,
  StatusInterno,
  Movimentacao,
  TipoMovimentacao,
  EventoProjeto,
  TipoEventoProjeto,
  Script,
  TipoChamado,
} from "@/types";
import { mockChamados } from "@/data/mockChamados";
import { mockClientes } from "@/data/mockClientes";
import { mockProjetos } from "@/data/mockProjetos";
import { mockScripts } from "@/data/mockScripts";
import { fetchGLPIData } from "@/lib/glpi/service";
import {
  mergeLocalState,
  setLocalChamado,
  getLocalChamados,
  getLocalProjetos,
  saveLocalProjetos,
} from "@/lib/localState";

type DataContextValue = {
  chamados: Chamado[];
  clientes: Cliente[];
  projetos: Projeto[];
  scripts: Script[];
  tiposChamado: TipoChamado[];
  syncing: boolean;
  syncGLPI: () => void;
  criarCliente: (dados: Omit<Cliente, "id">) => void;
  atualizarCliente: (id: string, patch: Partial<Omit<Cliente, "id">>) => void;
  removerCliente: (id: string) => void;
  atualizarObservacoesCliente: (id: string, novoConteudo: string, autorId: string) => void;
  atribuirTecnico: (chamadoId: string, tecnicoId: string, autorId: string, motivo?: string) => void;
  setPrioridade: (chamadoId: string, prioridade: Prioridade) => void;
  setStatus: (chamadoId: string, status: StatusInterno, autorId: string) => void;
  setVerMaisTarde: (chamadoId: string, ate: Date | null, motivo: string, autorId: string) => void;
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
  criarScript: (s: Omit<Script, "id">) => void;
  atualizarScript: (id: string, patch: Partial<Omit<Script, "id">>) => void;
  removerScript: (id: string) => void;
  duplicarScript: (id: string) => void;
  criarTipoChamado: (t: TipoChamado) => void;
  atualizarTipoChamado: (
    categoria: string,
    subcategoria: string | undefined,
    patch: TipoChamado,
  ) => void;
  removerTipoChamado: (categoria: string, subcategoria?: string) => void;
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
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>(() => {
    const local = getLocalProjetos();
    if (local.length > 0) return local;
    return mockProjetos.map((p) => ({
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
    }));
  });
  const [scripts, setScripts] = useState<Script[]>(mockScripts);
  const tiposIniciais = useMemo<TipoChamado[]>(() => {
    const set = new Map<string, TipoChamado>();
    for (const c of mockChamados) {
      const k = `${c.tipoChamado.categoria}|${c.tipoChamado.subcategoria ?? ""}`;
      if (!set.has(k)) set.set(k, c.tipoChamado);
    }
    return Array.from(set.values()).sort((a, b) =>
      a.categoria.localeCompare(b.categoria) ||
      (a.subcategoria ?? "").localeCompare(b.subcategoria ?? ""),
    );
  }, []);
  const [tiposChamado, setTiposChamado] = useState<TipoChamado[]>(tiposIniciais);
  const [syncing, setSyncing] = useState(false);

  const syncGLPI = useCallback(() => {
    setSyncing(true);
    fetchGLPIData()
      .then(({ chamados: glpiChamados, clientes: glpiClientes }) => {
        setChamados(mergeLocalState(glpiChamados));
        setClientes(glpiClientes);
      })
      .catch(() => {
        setChamados(mergeLocalState(mockChamados));
        setClientes(mockClientes);
      })
      .finally(() => setSyncing(false));
  }, []);

  useEffect(() => {
    syncGLPI();
  }, [syncGLPI]);

  useEffect(() => {
    saveLocalProjetos(projetos);
  }, [projetos]);

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
      clientes,
      projetos,
      scripts,
      tiposChamado,
      syncing,
      syncGLPI,
      criarCliente: (dados) => {
        const slug = dados.nome
          .toLowerCase()
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");
        const novo: Cliente = { ...dados, id: `${slug}-${Date.now()}` };
        setClientes((prev) => [...prev, novo]);
      },
      atualizarCliente: (id, patch) => {
        setClientes((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
      },
      removerCliente: (id) => {
        setClientes((prev) => prev.filter((c) => c.id !== id));
      },
      atualizarObservacoesCliente: (id, novoConteudo, autorId) => {
        setClientes((prev) =>
          prev.map((c) => {
            if (c.id !== id) return c;
            const entrada = {
              id: `obs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              data: new Date(),
              usuarioId: autorId,
              conteudo: novoConteudo,
            };
            return {
              ...c,
              observacoes: novoConteudo,
              historicoObservacoes: [...(c.historicoObservacoes ?? []), entrada],
            };
          }),
        );
      },
      atribuirTecnico: (chamadoId, tecnicoId, autorId, motivo) => {
        const mov = novaMov(chamadoId, autorId, "atribuicao", `Chamado atribuído a ${tecnicoId}.`, motivo);
        updateChamado(chamadoId, { tecnicoId }, mov);
        const lc = getLocalChamados()[chamadoId] ?? {};
        setLocalChamado(chamadoId, { movimentacoes: [...(lc.movimentacoes ?? []), mov] });
      },
      setPrioridade: (chamadoId, prioridade) => {
        // prioridade não gera entrada no histórico (decisão silenciosa)
        setChamados((prev) =>
          prev.map((c) => (c.id === chamadoId ? { ...c, prioridade } : c)),
        );
      },
      setStatus: (chamadoId, status, autorId) => {
        const mov = novaMov(chamadoId, autorId, "mudanca_status", `Status alterado para "${status}".`);
        updateChamado(chamadoId, { statusInterno: status }, mov);
        const lc = getLocalChamados()[chamadoId] ?? {};
        setLocalChamado(chamadoId, { statusOverride: status, movimentacoes: [...(lc.movimentacoes ?? []), mov] });
      },
      setVerMaisTarde: (chamadoId, ate, motivo, autorId) => {
        const desc = ate
          ? `Chamado em "Ver mais tarde" até ${ate.toLocaleString("pt-BR")}.`
          : '"Ver mais tarde" removido.';
        const mov = novaMov(chamadoId, autorId, "ver_mais_tarde", desc, ate ? motivo : undefined);
        updateChamado(chamadoId, { verMaisTardeAte: ate, verMaisTardeMotivo: ate ? motivo : null }, mov);
        const lc = getLocalChamados()[chamadoId] ?? {};
        setLocalChamado(chamadoId, {
          verMaisTardeAte: ate ? ate.toISOString() : null,
          verMaisTardeMotivo: ate ? motivo : null,
          movimentacoes: [...(lc.movimentacoes ?? []), mov],
        });
      },
      adicionarObservacao: (chamadoId, texto, autorId) => {
        const atual = chamados.find((c) => c.id === chamadoId);
        const obsAtual = atual?.observacoesInternas ?? "";
        const novaObs = obsAtual ? `${obsAtual}\n\n${texto}` : texto;
        const mov = novaMov(chamadoId, autorId, "observacao", texto);
        setChamados((prev) =>
          prev.map((c) => {
            if (c.id !== chamadoId) return c;
            return {
              ...c,
              observacoesInternas: novaObs,
              dataUltimaAtualizacao: new Date(),
              historicoMovimentacoes: [...c.historicoMovimentacoes, mov],
            };
          }),
        );
        const lc = getLocalChamados()[chamadoId] ?? {};
        setLocalChamado(chamadoId, { observacoesInternas: novaObs, movimentacoes: [...(lc.movimentacoes ?? []), mov] });
      },
      marcarScriptUsado: (chamadoId, scriptNome, autorId) => {
        const mov = novaMov(chamadoId, autorId, "observacao", `Script aplicado: "${scriptNome}".`);
        setChamados((prev) =>
          prev.map((c) =>
            c.id === chamadoId
              ? {
                  ...c,
                  dataUltimaAtualizacao: new Date(),
                  historicoMovimentacoes: [...c.historicoMovimentacoes, mov],
                }
              : c,
          ),
        );
        const lc = getLocalChamados()[chamadoId] ?? {};
        setLocalChamado(chamadoId, { movimentacoes: [...(lc.movimentacoes ?? []), mov] });
      },
      vincularProjeto: (chamadoId, projetoId, autorId) => {
        const mov = novaMov(chamadoId, autorId, "vinculacao_projeto", `Vinculado ao projeto ${projetoId}.`);
        updateChamado(chamadoId, { projetoId }, mov);
        const lc = getLocalChamados()[chamadoId] ?? {};
        setLocalChamado(chamadoId, { projetoId, movimentacoes: [...(lc.movimentacoes ?? []), mov] });
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
          const mov = novaMov(cid, autorId ?? "luciano", "vinculacao_projeto", `Vinculado ao novo projeto "${novo.nome}".`);
          updateChamado(cid, { projetoId: novo.id }, mov);
          const lc = getLocalChamados()[cid] ?? {};
          setLocalChamado(cid, { projetoId: novo.id, movimentacoes: [...(lc.movimentacoes ?? []), mov] });
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
        const movDesv = novaMov(chamadoId, autorId, "vinculacao_projeto", `Desvinculado do projeto.`);
        updateChamado(chamadoId, { projetoId: null }, movDesv);
        const lcDesv = getLocalChamados()[chamadoId] ?? {};
        setLocalChamado(chamadoId, { projetoId: null, movimentacoes: [...(lcDesv.movimentacoes ?? []), movDesv] });
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
        const mov = novaMov(chamadoId, autorId, "mudanca_status", `Triagem concluída — enviado para "a fazer hoje".`);
        updateChamado(chamadoId, { statusInterno: "a_fazer_hoje" }, mov);
        const lc = getLocalChamados()[chamadoId] ?? {};
        setLocalChamado(chamadoId, { statusOverride: "a_fazer_hoje", movimentacoes: [...(lc.movimentacoes ?? []), mov] });
      },
      criarScript: (s) => {
        const id = `script-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        setScripts((prev) => [...prev, { ...s, id }]);
      },
      atualizarScript: (id, patch) => {
        setScripts((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
      },
      removerScript: (id) => {
        setScripts((prev) => prev.filter((s) => s.id !== id));
      },
      duplicarScript: (id) => {
        setScripts((prev) => {
          const orig = prev.find((s) => s.id === id);
          if (!orig) return prev;
          return [
            ...prev,
            { ...orig, id: `${orig.id}-copy-${Date.now()}`, nome: `${orig.nome} (cópia)` },
          ];
        });
      },
      criarTipoChamado: (t) => {
        setTiposChamado((prev) => {
          const existe = prev.some(
            (x) => x.categoria === t.categoria && (x.subcategoria ?? "") === (t.subcategoria ?? ""),
          );
          if (existe) return prev;
          return [...prev, t].sort((a, b) =>
            a.categoria.localeCompare(b.categoria) ||
            (a.subcategoria ?? "").localeCompare(b.subcategoria ?? ""),
          );
        });
      },
      atualizarTipoChamado: (categoria, subcategoria, patch) => {
        setTiposChamado((prev) =>
          prev.map((x) =>
            x.categoria === categoria && (x.subcategoria ?? "") === (subcategoria ?? "")
              ? patch
              : x,
          ),
        );
      },
      removerTipoChamado: (categoria, subcategoria) => {
        setTiposChamado((prev) =>
          prev.filter(
            (x) => !(x.categoria === categoria && (x.subcategoria ?? "") === (subcategoria ?? "")),
          ),
        );
      },
    }),
    [chamados, clientes, projetos, scripts, tiposChamado, syncing, syncGLPI, updateChamado],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}

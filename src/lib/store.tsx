import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Chamado, Projeto, Prioridade, StatusInterno } from "@/types";
import { mockChamados } from "@/data/mockChamados";
import { mockProjetos } from "@/data/mockProjetos";

type DataContextValue = {
  chamados: Chamado[];
  projetos: Projeto[];
  atribuirTecnico: (chamadoId: string, tecnicoId: string) => void;
  setPrioridade: (chamadoId: string, prioridade: Prioridade) => void;
  setStatus: (chamadoId: string, status: StatusInterno) => void;
  vincularProjeto: (chamadoId: string, projetoId: string) => void;
  criarProjeto: (projeto: Omit<Projeto, "id" | "dataCriacao" | "chamadosVinculados"> & { chamadoIdInicial?: string }) => Projeto;
  concluirTriagem: (chamadoId: string) => void;
};

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [chamados, setChamados] = useState<Chamado[]>(mockChamados);
  const [projetos, setProjetos] = useState<Projeto[]>(mockProjetos);

  const value = useMemo<DataContextValue>(
    () => ({
      chamados,
      projetos,
      atribuirTecnico: (chamadoId, tecnicoId) => {
        setChamados((prev) =>
          prev.map((c) =>
            c.id === chamadoId
              ? { ...c, tecnicoId, dataUltimaAtualizacao: new Date() }
              : c,
          ),
        );
      },
      setPrioridade: (chamadoId, prioridade) => {
        setChamados((prev) =>
          prev.map((c) => (c.id === chamadoId ? { ...c, prioridade } : c)),
        );
      },
      setStatus: (chamadoId, status) => {
        setChamados((prev) =>
          prev.map((c) =>
            c.id === chamadoId
              ? { ...c, statusInterno: status, dataUltimaAtualizacao: new Date() }
              : c,
          ),
        );
      },
      vincularProjeto: (chamadoId, projetoId) => {
        setChamados((prev) =>
          prev.map((c) => (c.id === chamadoId ? { ...c, projetoId } : c)),
        );
        setProjetos((prev) =>
          prev.map((p) =>
            p.id === projetoId && !p.chamadosVinculados.includes(chamadoId)
              ? { ...p, chamadosVinculados: [...p.chamadosVinculados, chamadoId] }
              : p,
          ),
        );
      },
      criarProjeto: ({ chamadoIdInicial, ...dados }) => {
        const novo: Projeto = {
          ...dados,
          id: `proj-${Date.now()}`,
          dataCriacao: new Date(),
          chamadosVinculados: chamadoIdInicial ? [chamadoIdInicial] : [],
        };
        setProjetos((prev) => [...prev, novo]);
        if (chamadoIdInicial) {
          setChamados((prev) =>
            prev.map((c) => (c.id === chamadoIdInicial ? { ...c, projetoId: novo.id } : c)),
          );
        }
        return novo;
      },
      concluirTriagem: (chamadoId) => {
        setChamados((prev) =>
          prev.map((c) =>
            c.id === chamadoId
              ? { ...c, statusInterno: "a_fazer_hoje", dataUltimaAtualizacao: new Date() }
              : c,
          ),
        );
      },
    }),
    [chamados, projetos],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}

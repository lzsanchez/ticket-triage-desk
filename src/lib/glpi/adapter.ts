import type { Chamado, Cliente, StatusInterno, Prioridade } from "@/types";
import type { GLPITicket, GLPIEntity } from "./types";

export function mapGLPIStatus(s: number): StatusInterno {
  switch (s) {
    case 1: return "triagem";               // Novo
    case 2: return "em_tratativa";          // Em curso (atribuído)
    case 3: return "a_fazer_hoje";          // Em curso (planejado)
    case 4: return "aguardando_terceiro";   // Pendente
    case 5:
    case 6: return "concluido";             // Resolvido / Fechado
    default: return "triagem";
  }
}

export function mapGLPIPriority(p: number): Prioridade {
  if (p <= 2) return "baixa";
  if (p === 3) return "media";
  if (p <= 5) return "alta";
  return "critica";
}

function parseGLPIDate(s: string | null | undefined): Date {
  if (!s || s === "NULL") return new Date();
  // GLPI retorna datas no fuso do servidor — assumir UTC ou ajustar conforme necessário
  return new Date(s.replace(" ", "T") + "Z");
}

export function adaptTicket(t: GLPITicket, tecnicoId: string | null): Chamado {
  // expand_dropdowns=true converte itilcategories_id para o nome da categoria
  const categoria =
    typeof t.itilcategories_id === "string" && t.itilcategories_id !== "0"
      ? t.itilcategories_id
      : t.type === 1
        ? "Incidente"
        : "Requisição";

  return {
    id: String(t.id),
    titulo: t.name,
    clienteId: String(
      typeof t.entities_id === "number" ? t.entities_id : t.entities_id,
    ),
    tipoChamado: { categoria },
    tecnicoId,
    dataAbertura: parseGLPIDate(t.date),
    dataUltimaAtualizacao: parseGLPIDate(t.date_mod),
    statusInterno: mapGLPIStatus(t.status),
    prioridade: mapGLPIPriority(t.priority),
    verMaisTardeAte: null,
    verMaisTardeMotivo: null,
    projetoId: null,
    observacoesInternas: "",
    historicoMovimentacoes: [],
  };
}

export function adaptEntity(e: GLPIEntity): Cliente {
  return {
    id: String(e.id),
    nome: e.name,
    entidadeGLPI: e.completename,
  };
}

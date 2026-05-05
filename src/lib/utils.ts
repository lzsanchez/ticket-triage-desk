import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Chamado, StatusVisual } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MS_POR_DIA = 1000 * 60 * 60 * 24;

/** Diferença em dias inteiros entre `data` e agora (ou referência fornecida). */
function diasDesde(data: Date, ref: Date = new Date()): number {
  const diff = ref.getTime() - data.getTime();
  return Math.max(0, Math.floor(diff / MS_POR_DIA));
}

/** Aging do chamado: quantos dias desde a abertura. */
export function calcularAging(dataAbertura: Date, ref?: Date): number {
  return diasDesde(dataAbertura, ref);
}

/** Dias desde a última atualização do chamado. */
export function calcularDiasSemUpdate(dataUltimaAtualizacao: Date, ref?: Date): number {
  return diasDesde(dataUltimaAtualizacao, ref);
}

/** Returns a GLPI ticket URL for the given chamado ID. */
export function getGLPIUrl(chamadoId: string): string {
  return `https://glpi.mobitsolucoes.com.br/front/ticket.form.php?id=${chamadoId}`;
}

/** Formats a date as dd/MM/yyyy. */
export function formatarData(data: Date): string {
  return format(data, "dd/MM/yyyy", { locale: ptBR });
}

/** Formats a date as dd/MM/yyyy HH:mm. */
export function formatarDataHora(data: Date): string {
  return format(data, "dd/MM/yyyy HH:mm", { locale: ptBR });
}

/** Returns a human-readable relative date string (e.g. "há 3 dias"). */
export function formatarDataRelativa(data: Date): string {
  return formatDistanceToNow(data, { addSuffix: true, locale: ptBR });
}

/**
 * Status visual do chamado:
 *  - cinza:    em "ver mais tarde" ativo
 *  - verde:    dias sem update <= 3
 *  - amarelo:  dias sem update entre 4 e 7
 *  - vermelho: dias sem update > 7
 */
export function getStatusVisual(chamado: Chamado, ref: Date = new Date()): StatusVisual {
  if (chamado.verMaisTardeAte && chamado.verMaisTardeAte.getTime() > ref.getTime()) {
    return "cinza";
  }
  const dias = calcularDiasSemUpdate(chamado.dataUltimaAtualizacao, ref);
  if (dias <= 3) return "verde";
  if (dias <= 7) return "amarelo";
  return "vermelho";
}

export const GLPI_BASE_URL = "https://mobdesk.mobitsolucoes.com";

export function glpiTicketUrl(id: string | number): string {
  return `${GLPI_BASE_URL}/front/ticket.form.php?id=${id}`;
}

const PAD = (n: number) => n.toString().padStart(2, "0");

/** Formata data como dd/mm/yyyy HH:mm (24h, pt-BR). */
export function fmtDataBR(d: Date | null | undefined): string {
  if (!d) return "—";
  return `${PAD(d.getDate())}/${PAD(d.getMonth() + 1)}/${d.getFullYear()} ${PAD(d.getHours())}:${PAD(d.getMinutes())}`;
}

/** Formata só a data dd/mm/yyyy. */
export function fmtDateBR(d: Date | null | undefined): string {
  if (!d) return "—";
  return `${PAD(d.getDate())}/${PAD(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Substitui placeholders {chave} no script pelos dados do chamado. */
export function aplicarPlaceholdersScript(
  conteudo: string,
  ctx: {
    cliente?: string;
    id_chamado?: string;
    tecnico?: string;
    titulo?: string;
    [k: string]: string | undefined;
  },
): string {
  return conteudo.replace(/\{(\w+)\}/g, (_, k: string) => ctx[k] ?? `{${k}}`);
}


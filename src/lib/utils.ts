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

/**
 * Status visual do chamado:
 *  - cinza:    em "ver mais tarde" ativo
 *  - verde:    dias sem update <= 3
 *  - amarelo:  dias sem update entre 4 e 7
 *  - vermelho: dias sem update > 7
 */
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

export function getStatusVisual(chamado: Chamado, ref: Date = new Date()): StatusVisual {
  if (chamado.verMaisTardeAte && chamado.verMaisTardeAte.getTime() > ref.getTime()) {
    return "cinza";
  }
  const dias = calcularDiasSemUpdate(chamado.dataUltimaAtualizacao, ref);
  if (dias <= 3) return "verde";
  if (dias <= 7) return "amarelo";
  return "vermelho";
}

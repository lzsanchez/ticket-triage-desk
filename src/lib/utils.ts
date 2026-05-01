import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
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
 *  - cinza:    em snooze ativo
 *  - verde:    dias sem update <= 3
 *  - amarelo:  dias sem update entre 4 e 7
 *  - vermelho: dias sem update > 7
 */
export function getStatusVisual(chamado: Chamado, ref: Date = new Date()): StatusVisual {
  if (chamado.snoozeAte && chamado.snoozeAte.getTime() > ref.getTime()) {
    return "cinza";
  }
  const dias = calcularDiasSemUpdate(chamado.dataUltimaAtualizacao, ref);
  if (dias <= 3) return "verde";
  if (dias <= 7) return "amarelo";
  return "vermelho";
}

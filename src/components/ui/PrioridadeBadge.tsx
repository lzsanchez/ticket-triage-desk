import { cn } from "@/lib/utils";
import type { Prioridade } from "@/types";

const LABEL: Record<Prioridade, string> = {
  baixa:   "Baixa",
  media:   "Média",
  alta:    "Alta",
  critica: "Crítica",
};

const STYLE: Record<Prioridade, string> = {
  baixa:   "bg-muted text-muted-foreground border border-border",
  media:   "bg-secondary text-secondary-foreground border border-border",
  alta:    "bg-warning/15 text-warning border border-warning/30",
  critica: "bg-destructive/15 text-destructive border border-destructive/30",
};

type Props = {
  prioridade: Prioridade;
  className?: string;
};

export function PrioridadeBadge({ prioridade, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap capitalize",
        STYLE[prioridade],
        className,
      )}
    >
      {LABEL[prioridade]}
    </span>
  );
}

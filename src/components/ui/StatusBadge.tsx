import { cn } from "@/lib/utils";
import type { StatusInterno } from "@/types";

const LABEL: Record<StatusInterno, string> = {
  triagem:              "Triagem",
  a_fazer_hoje:         "A fazer hoje",
  em_tratativa:         "Em tratativa",
  aguardando_terceiro:  "Aguardando terceiro",
  aguardando_gestor:    "Aguardando gestor",
  ver_mais_tarde:       "Ver mais tarde",
  concluido:            "Concluído",
};

const STYLE: Record<StatusInterno, string> = {
  triagem:              "bg-muted text-muted-foreground border border-border",
  a_fazer_hoje:         "bg-primary/10 text-primary border border-primary/30",
  em_tratativa:         "bg-success/10 text-success border border-success/30",
  aguardando_terceiro:  "bg-muted text-foreground border border-border",
  aguardando_gestor:    "bg-warning/15 text-warning border border-warning/30",
  ver_mais_tarde:       "bg-muted/60 text-muted-foreground border border-border",
  concluido:            "bg-success/20 text-success border border-success/40",
};

type Props = {
  status: StatusInterno;
  className?: string;
};

export function StatusBadge({ status, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        STYLE[status],
        className,
      )}
    >
      {LABEL[status]}
    </span>
  );
}

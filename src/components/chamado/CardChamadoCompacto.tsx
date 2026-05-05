import { Moon, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { mockClientes } from "@/data/mockClientes";
import { calcularAging, calcularDiasSemUpdate, cn, getStatusVisual } from "@/lib/utils";
import type { Chamado, StatusVisual } from "@/types";

export const STATUS_DOT: Record<StatusVisual, string> = {
  verde: "bg-success",
  amarelo: "bg-warning",
  vermelho: "bg-destructive",
  cinza: "bg-muted-foreground/60",
};

export function CardChamadoCompacto({
  chamado,
  dragging,
}: {
  chamado: Chamado;
  dragging?: boolean;
}) {
  const cliente = mockClientes.find((c) => c.id === chamado.clienteId);
  const visual = getStatusVisual(chamado);
  const aging = calcularAging(chamado.dataAbertura);
  const semUpdate = calcularDiasSemUpdate(chamado.dataUltimaAtualizacao);
  const emVerMaisTarde = chamado.verMaisTardeAte && chamado.verMaisTardeAte.getTime() > Date.now();
  const diasParaVoltar = emVerMaisTarde
    ? Math.max(1, Math.ceil((chamado.verMaisTardeAte!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div
      className={cn(
        "group rounded-md border border-border bg-card p-2.5 shadow-sm cursor-grab active:cursor-grabbing select-none",
        emVerMaisTarde && "opacity-50",
        dragging && "shadow-lg ring-2 ring-primary/30 cursor-grabbing",
      )}
    >
      <div className="flex items-start gap-2">
        <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", STATUS_DOT[visual])} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] font-semibold text-primary">{chamado.id}</span>
            <span
              className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
              title={`Aberto há ${aging}d · ${semUpdate}d sem update`}
            >
              <Clock className="h-2.5 w-2.5" />
              {aging}d
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-[13px] font-medium leading-snug text-foreground">
            {chamado.titulo}
          </p>
          <div className="mt-1 flex items-center justify-between gap-1">
            <span className="truncate text-[11px] text-muted-foreground">{cliente?.nome}</span>
            {emVerMaisTarde ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center text-muted-foreground">
                    <Moon className="h-3 w-3" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Ver mais tarde · volta em {diasParaVoltar}d
                  {chamado.verMaisTardeMotivo ? ` — ${chamado.verMaisTardeMotivo}` : ""}
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

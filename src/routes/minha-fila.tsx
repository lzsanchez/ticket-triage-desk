import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Moon, Clock } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/store";
import { mockClientes } from "@/data/mockClientes";
import { calcularAging, calcularDiasSemUpdate, cn, getStatusVisual } from "@/lib/utils";
import type { Chamado, StatusInterno, StatusVisual } from "@/types";
import { FiltrosMultiselect } from "@/components/triagem/FiltrosMultiselect";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const Route = createFileRoute("/minha-fila")({
  component: MinhaFilaPage,
});

type ColunaDef = {
  status: StatusInterno;
  titulo: string;
  headerClass: string;
  borderClass: string;
};

const COLUNAS: ColunaDef[] = [
  {
    status: "a_fazer_hoje",
    titulo: "A fazer hoje",
    headerClass: "bg-secondary text-secondary-foreground",
    borderClass: "border-secondary",
  },
  {
    status: "em_tratativa",
    titulo: "Em tratativa",
    headerClass: "bg-primary text-primary-foreground",
    borderClass: "border-primary/40",
  },
  {
    status: "aguardando_terceiro",
    titulo: "Aguardando terceiro",
    headerClass: "bg-muted text-foreground",
    borderClass: "border-border",
  },
  {
    status: "aguardando_gestor",
    titulo: "Aguardando gestor",
    headerClass: "bg-warning text-warning-foreground",
    borderClass: "border-warning/40",
  },
  {
    status: "concluido",
    titulo: "Concluído hoje",
    headerClass: "bg-success text-success-foreground",
    borderClass: "border-success/40",
  },
];

const STATUS_VISUAL_OPTS = [
  { value: "verde", label: "🟢 Verde" },
  { value: "amarelo", label: "🟡 Amarelo" },
  { value: "vermelho", label: "🔴 Vermelho" },
  { value: "cinza", label: "⚪ Cinza (snooze)" },
];

function MinhaFilaPage() {
  return (
    <AppShell>
      <MinhaFila />
    </AppShell>
  );
}

function ehHoje(d: Date) {
  const hoje = new Date();
  return (
    d.getFullYear() === hoje.getFullYear() &&
    d.getMonth() === hoje.getMonth() &&
    d.getDate() === hoje.getDate()
  );
}

function MinhaFila() {
  const { user } = useAuth();
  const { chamados, setStatus } = useData();
  const [filtroClientes, setFiltroClientes] = useState<string[]>([]);
  const [filtroTipos, setFiltroTipos] = useState<string[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<string[]>([]);
  const [esconderSnooze, setEsconderSnooze] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  if (!user) return null;

  const meusChamados = useMemo(
    () => chamados.filter((c) => c.tecnicoId === user.id),
    [chamados, user.id],
  );

  const opcoesClientes = useMemo(() => {
    const ids = new Set(meusChamados.map((c) => c.clienteId));
    return mockClientes.filter((c) => ids.has(c.id)).map((c) => ({ value: c.id, label: c.nome }));
  }, [meusChamados]);

  const opcoesTipos = useMemo(() => {
    const set = new Set<string>();
    meusChamados.forEach((c) => set.add(c.tipoChamado.categoria));
    return Array.from(set).map((v) => ({ value: v, label: v }));
  }, [meusChamados]);

  const filtrados = useMemo(() => {
    return meusChamados.filter((c) => {
      if (filtroClientes.length && !filtroClientes.includes(c.clienteId)) return false;
      if (filtroTipos.length && !filtroTipos.includes(c.tipoChamado.categoria)) return false;
      if (filtroStatus.length && !filtroStatus.includes(getStatusVisual(c))) return false;
      const snoozed = c.snoozeAte && c.snoozeAte.getTime() > Date.now();
      if (esconderSnooze && snoozed) return false;
      return true;
    });
  }, [meusChamados, filtroClientes, filtroTipos, filtroStatus, esconderSnooze]);

  const porColuna = useMemo(() => {
    const map: Record<StatusInterno, Chamado[]> = {
      triagem: [],
      a_fazer_hoje: [],
      em_tratativa: [],
      aguardando_terceiro: [],
      aguardando_gestor: [],
      concluido: [],
    };
    for (const c of filtrados) {
      if (c.statusInterno === "concluido") {
        if (ehHoje(c.dataUltimaAtualizacao)) map.concluido.push(c);
      } else if (c.statusInterno in map) {
        map[c.statusInterno].push(c);
      }
    }
    return map;
  }, [filtrados]);

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const overId = e.over?.id as StatusInterno | undefined;
    const id = e.active.id as string;
    if (!overId) return;
    const chamado = chamados.find((c) => c.id === id);
    if (!chamado || chamado.statusInterno === overId) return;
    setStatus(id, overId);
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string);
  }

  const total = meusChamados.length;
  const filtroAtivo = filtroClientes.length + filtroTipos.length + filtroStatus.length + (esconderSnooze ? 1 : 0) > 0;

  const activeChamado = activeId ? chamados.find((c) => c.id === activeId) ?? null : null;

  return (
    <TooltipProvider delayDuration={200}>
      <div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Operação diária</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
              Minha Fila
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {total} {total === 1 ? "chamado atribuído" : "chamados atribuídos"} a {user.name.split(" ")[0]}
              {filtroAtivo ? ` · exibindo ${filtrados.length}` : ""}.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
          <FiltrosMultiselect
            label="Cliente"
            options={opcoesClientes}
            selected={filtroClientes}
            onChange={setFiltroClientes}
          />
          <FiltrosMultiselect
            label="Tipo"
            options={opcoesTipos}
            selected={filtroTipos}
            onChange={setFiltroTipos}
          />
          <FiltrosMultiselect
            label="Status visual"
            options={STATUS_VISUAL_OPTS}
            selected={filtroStatus}
            onChange={setFiltroStatus}
          />
          <div className="ml-auto flex items-center gap-2">
            <Label htmlFor="esconder-snooze" className="text-xs text-muted-foreground">
              Esconder snoozados
            </Label>
            <Switch id="esconder-snooze" checked={esconderSnooze} onCheckedChange={setEsconderSnooze} />
          </div>
        </div>

        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="mt-4 grid grid-cols-5 gap-3 min-w-[1100px] overflow-x-auto pb-4">
            {COLUNAS.map((col) => (
              <Coluna key={col.status} def={col} chamados={porColuna[col.status]} />
            ))}
          </div>

          <DragOverlay>
            {activeChamado ? <CardChamado chamado={activeChamado} dragging /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </TooltipProvider>
  );
}

function Coluna({ def, chamados }: { def: ColunaDef; chamados: Chamado[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: def.status });

  return (
    <div className={cn("flex flex-col rounded-md border bg-muted/30", def.borderClass)}>
      <div
        className={cn(
          "flex items-center justify-between rounded-t-md px-3 py-2 text-sm font-semibold",
          def.headerClass,
        )}
      >
        <span className="truncate">{def.titulo}</span>
        <span className="inline-flex min-w-[22px] items-center justify-center rounded-full bg-black/15 px-1.5 py-0.5 text-[11px] font-bold">
          {chamados.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 p-2 min-h-[400px] transition-colors",
          isOver && "bg-accent/40",
        )}
      >
        {chamados.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-[11px] text-muted-foreground">
            —
          </div>
        ) : (
          chamados.map((c) => <DraggableCard key={c.id} chamado={c} />)
        )}
      </div>
    </div>
  );
}

function DraggableCard({ chamado }: { chamado: Chamado }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: chamado.id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn("touch-none", isDragging && "opacity-30")}
    >
      <CardChamado chamado={chamado} />
    </div>
  );
}

const STATUS_DOT: Record<StatusVisual, string> = {
  verde: "bg-success",
  amarelo: "bg-warning",
  vermelho: "bg-destructive",
  cinza: "bg-muted-foreground/60",
};

function CardChamado({ chamado, dragging }: { chamado: Chamado; dragging?: boolean }) {
  const cliente = mockClientes.find((c) => c.id === chamado.clienteId);
  const visual = getStatusVisual(chamado);
  const aging = calcularAging(chamado.dataAbertura);
  const semUpdate = calcularDiasSemUpdate(chamado.dataUltimaAtualizacao);
  const snoozed = chamado.snoozeAte && chamado.snoozeAte.getTime() > Date.now();

  const diasParaVoltar = snoozed
    ? Math.max(1, Math.ceil((chamado.snoozeAte!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div
      className={cn(
        "group rounded-md border border-border bg-card p-2.5 shadow-sm cursor-grab active:cursor-grabbing select-none",
        snoozed && "opacity-50",
        dragging && "shadow-lg ring-2 ring-primary/30 cursor-grabbing",
      )}
    >
      <div className="flex items-start gap-2">
        <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", STATUS_DOT[visual])} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] font-semibold text-primary">{chamado.id}</span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground",
              )}
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
            {snoozed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center text-muted-foreground">
                    <Moon className="h-3 w-3" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Em snooze · volta em {diasParaVoltar}d
                  {chamado.snoozeMotivo ? ` — ${chamado.snoozeMotivo}` : ""}
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

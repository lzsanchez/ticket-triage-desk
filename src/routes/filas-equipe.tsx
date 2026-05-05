import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronsRight,
  LayoutGrid,
  Rows3,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/store";
import { useChamadoModal } from "@/lib/chamadoModal";
import { mockClientes } from "@/data/mockClientes";
import { mockUsuarios } from "@/data/mockUsuarios";
import { calcularAging, calcularDiasSemUpdate, cn, getStatusVisual } from "@/lib/utils";
import type { Chamado, Prioridade, StatusVisual } from "@/types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CardChamadoCompacto, STATUS_DOT } from "@/components/chamado/CardChamadoCompacto";
import { FiltrosMultiselect } from "@/components/triagem/FiltrosMultiselect";

export const Route = createFileRoute("/filas-equipe")({
  component: FilasEquipePage,
});

const TECNICOS = mockUsuarios.filter((u) => u.id !== "luciano" || u.perfil === "gestor"); // todos os 3
const PRIO_ORDEM: Record<Prioridade, number> = { critica: 4, alta: 3, media: 2, baixa: 1 };

type SortKey = "aging" | "semUpdate" | "prioridade";

function FilasEquipePage() {
  return (
    <AppShell>
      <FilasEquipe />
    </AppShell>
  );
}

function FilasEquipe() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role !== "gestor") return <Navigate to="/" />;
  return (
    <TooltipProvider delayDuration={200}>
      <FilasEquipeBody />
    </TooltipProvider>
  );
}

function FilasEquipeBody() {
  const { chamados } = useData();
  const [modo, setModo] = useState<"tecnico" | "consolidada">("tecnico");

  const ativos = useMemo(
    () => chamados.filter((c) => c.statusInterno !== "concluido" && c.tecnicoId !== null),
    [chamados],
  );

  const total = ativos.length;
  const vermelhos = ativos.filter((c) => getStatusVisual(c) === "vermelho").length;
  const aguardandoGestor = ativos.filter((c) => c.statusInterno === "aguardando_gestor").length;
  const verMaisTardeVencido = ativos.filter(
    (c) => c.verMaisTardeAte && c.verMaisTardeAte.getTime() <= Date.now(),
  ).length;

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Visão consolidada</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
            Filas da Equipe
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acompanhamento das filas dos 3 analistas, com possibilidade de redistribuir chamados.
          </p>
        </div>
        <div className="inline-flex rounded-md border border-border bg-card p-0.5">
          <button
            onClick={() => setModo("tecnico")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium",
              modo === "tecnico"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Por técnico
          </button>
          <button
            onClick={() => setModo("consolidada")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium",
              modo === "consolidada"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Rows3 className="h-3.5 w-3.5" /> Consolidada
          </button>
        </div>
      </div>

      {/* Indicadores */}
      <div className="mt-6 grid grid-cols-4 gap-3">
        <Indicador label="Total no backlog" value={total} />
        <Indicador label="Chamados parados (vermelho)" value={vermelhos} tone="destructive" />
        <Indicador label="Aguardando você" value={aguardandoGestor} tone="warning" />
        <Indicador label="Ver mais tarde vencidos sem ação" value={verMaisTardeVencido} tone="muted" />
      </div>

      <div className="mt-6">
        {modo === "tecnico" ? <ModoPorTecnico /> : <ModoConsolidada />}
      </div>
    </div>
  );
}

function Indicador({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "destructive" | "warning" | "muted";
}) {
  const toneClass =
    tone === "destructive"
      ? "text-destructive"
      : tone === "warning"
        ? "text-warning"
        : tone === "muted"
          ? "text-muted-foreground"
          : "text-foreground";
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold", toneClass)}>{value}</p>
    </div>
  );
}

/* =========================================================================
 * Modo "Por técnico" — colunas com drag-and-drop e diálogo de redistribuição
 * =======================================================================*/

function ModoPorTecnico() {
  const { user } = useAuth();
  const { chamados, atribuirTecnico } = useData();
  const [sortKey, setSortKey] = useState<SortKey>("semUpdate");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendente, setPendente] = useState<{ chamadoId: string; novoTecnicoId: string } | null>(null);
  const [motivoRedist, setMotivoRedist] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const porTecnico = useMemo(() => {
    const map: Record<string, Chamado[]> = {};
    for (const t of mockUsuarios) map[t.id] = [];
    for (const c of chamados) {
      if (c.statusInterno === "concluido" || c.tecnicoId === null) continue;
      if (!map[c.tecnicoId]) map[c.tecnicoId] = [];
      map[c.tecnicoId].push(c);
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => sortByKey(b, a, sortKey));
    }
    return map;
  }, [chamados, sortKey]);

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const overId = e.over?.id as string | undefined;
    const id = e.active.id as string;
    if (!overId) return;
    const novoTec = overId.replace(/^col-/, "");
    const chamado = chamados.find((c) => c.id === id);
    if (!chamado || chamado.tecnicoId === novoTec) return;
    setPendente({ chamadoId: id, novoTecnicoId: novoTec });
    setMotivoRedist("");
  }

  function confirmarRedistribuicao() {
    if (!pendente || !user) return;
    atribuirTecnico(
      pendente.chamadoId,
      pendente.novoTecnicoId,
      user.id,
      motivoRedist.trim() || undefined,
    );
    setPendente(null);
    setMotivoRedist("");
  }

  const activeChamado = activeId ? chamados.find((c) => c.id === activeId) ?? null : null;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">Ordenar cards por:</span>
        <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
          <SelectTrigger className="h-8 w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="aging">Aging (mais antigos)</SelectItem>
            <SelectItem value="semUpdate">Dias sem update</SelectItem>
            <SelectItem value="prioridade">Prioridade</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-3 gap-3">
          {mockUsuarios.map((tec) => (
            <ColunaTecnico key={tec.id} tecnicoId={tec.id} chamados={porTecnico[tec.id] ?? []} />
          ))}
        </div>
        <DragOverlay>
          {activeChamado ? <CardChamadoCompacto chamado={activeChamado} dragging /> : null}
        </DragOverlay>
      </DndContext>

      <Dialog open={pendente !== null} onOpenChange={(o) => !o && setPendente(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChevronsRight className="h-5 w-5" /> Redistribuir chamado
            </DialogTitle>
            <DialogDescription>
              {pendente
                ? `${pendente.chamadoId} → ${
                    mockUsuarios.find((u) => u.id === pendente.novoTecnicoId)?.nome ?? ""
                  }`
                : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Motivo da redistribuição (opcional)</Label>
            <Input
              value={motivoRedist}
              onChange={(e) => setMotivoRedist(e.target.value)}
              placeholder="Ex: Pedro está sobrecarregado nesta semana"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              O motivo será registrado no histórico de movimentações do chamado.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPendente(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmarRedistribuicao}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ColunaTecnico({ tecnicoId, chamados }: { tecnicoId: string; chamados: Chamado[] }) {
  const tec = mockUsuarios.find((u) => u.id === tecnicoId);
  const { setNodeRef, isOver } = useDroppable({ id: `col-${tecnicoId}` });
  const verdes = chamados.filter((c) => getStatusVisual(c) === "verde").length;
  const amarelos = chamados.filter((c) => getStatusVisual(c) === "amarelo").length;
  const vermelhos = chamados.filter((c) => getStatusVisual(c) === "vermelho").length;
  const cinzas = chamados.filter((c) => getStatusVisual(c) === "cinza").length;
  const iniciais = (tec?.nome ?? "")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="flex flex-col rounded-md border border-border bg-muted/20">
      <div className="flex items-center gap-3 border-b border-border bg-card px-3 py-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
          {iniciais}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{tec?.nome}</p>
          <p className="text-[11px] capitalize text-muted-foreground">{tec?.perfil}</p>
        </div>
        <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
          {chamados.length}
        </span>
      </div>
      <div className="flex items-center gap-3 border-b border-border bg-card/60 px-3 py-1.5 text-[11px] text-muted-foreground">
        <DotCount color={STATUS_DOT.verde} count={verdes} />
        <DotCount color={STATUS_DOT.amarelo} count={amarelos} />
        <DotCount color={STATUS_DOT.vermelho} count={vermelhos} />
        <DotCount color={STATUS_DOT.cinza} count={cinzas} />
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
            Sem chamados ativos
          </div>
        ) : (
          chamados.map((c) => <DraggableTeamCard key={c.id} chamado={c} />)
        )}
      </div>
    </div>
  );
}

function DotCount({ color, count }: { color: string; count: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("h-2 w-2 rounded-full", color)} />
      {count}
    </span>
  );
}

function DraggableTeamCard({ chamado }: { chamado: Chamado }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: chamado.id });
  const { abrir } = useChamadoModal();
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => abrir(chamado.id)}
      className={cn("touch-none", isDragging && "opacity-30")}
    >
      <CardChamadoCompacto chamado={chamado} />
    </div>
  );
}

function sortByKey(a: Chamado, b: Chamado, key: SortKey) {
  if (key === "aging") return calcularAging(a.dataAbertura) - calcularAging(b.dataAbertura);
  if (key === "semUpdate")
    return (
      calcularDiasSemUpdate(a.dataUltimaAtualizacao) -
      calcularDiasSemUpdate(b.dataUltimaAtualizacao)
    );
  return PRIO_ORDEM[a.prioridade] - PRIO_ORDEM[b.prioridade];
}

/* =========================================================================
 * Modo "Consolidada" — tabela única com sort + filtros
 * =======================================================================*/

type ColKey =
  | "visual"
  | "id"
  | "cliente"
  | "titulo"
  | "tipo"
  | "tecnico"
  | "aging"
  | "semUpdate"
  | "prioridade";

const STATUS_VISUAL_OPTS = [
  { value: "verde", label: "🟢 Verde" },
  { value: "amarelo", label: "🟡 Amarelo" },
  { value: "vermelho", label: "🔴 Vermelho" },
  { value: "cinza", label: "⚪ Cinza (ver mais tarde)" },
];

function ModoConsolidada() {
  const { chamados } = useData();
  const { abrir } = useChamadoModal();
  const [sortCol, setSortCol] = useState<ColKey>("semUpdate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [fTec, setFTec] = useState<string[]>([]);
  const [fStatus, setFStatus] = useState<string[]>([]);
  const [fCliente, setFCliente] = useState<string[]>([]);
  const [fTipo, setFTipo] = useState<string[]>([]);

  const ativos = useMemo(
    () => chamados.filter((c) => c.statusInterno !== "concluido" && c.tecnicoId !== null),
    [chamados],
  );

  const opcoesTec = mockUsuarios.map((u) => ({ value: u.id, label: u.nome }));
  const opcoesCliente = mockClientes.map((c) => ({ value: c.id, label: c.nome }));
  const opcoesTipo = useMemo(() => {
    const set = new Set<string>();
    ativos.forEach((c) => set.add(c.tipoChamado.categoria));
    return Array.from(set).map((v) => ({ value: v, label: v }));
  }, [ativos]);

  const filtrados = useMemo(() => {
    return ativos.filter((c) => {
      if (fTec.length && !fTec.includes(c.tecnicoId ?? "")) return false;
      if (fStatus.length && !fStatus.includes(getStatusVisual(c))) return false;
      if (fCliente.length && !fCliente.includes(c.clienteId)) return false;
      if (fTipo.length && !fTipo.includes(c.tipoChamado.categoria)) return false;
      return true;
    });
  }, [ativos, fTec, fStatus, fCliente, fTipo]);

  const ordenados = useMemo(() => {
    const arr = [...filtrados];
    arr.sort((a, b) => {
      const v = compare(a, b, sortCol);
      return sortDir === "asc" ? v : -v;
    });
    return arr;
  }, [filtrados, sortCol, sortDir]);

  function toggleSort(col: ColKey) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortCol(col);
      setSortDir("desc");
    }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
        <FiltrosMultiselect label="Técnico" options={opcoesTec} selected={fTec} onChange={setFTec} />
        <FiltrosMultiselect
          label="Status visual"
          options={STATUS_VISUAL_OPTS}
          selected={fStatus}
          onChange={setFStatus}
        />
        <FiltrosMultiselect
          label="Cliente"
          options={opcoesCliente}
          selected={fCliente}
          onChange={setFCliente}
        />
        <FiltrosMultiselect label="Tipo" options={opcoesTipo} selected={fTipo} onChange={setFTipo} />
        <span className="ml-auto text-xs text-muted-foreground">
          {ordenados.length} de {ativos.length}
        </span>
      </div>

      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <Th col="visual" sortCol={sortCol} sortDir={sortDir} toggle={toggleSort} className="w-8">
                ●
              </Th>
              <Th col="id" sortCol={sortCol} sortDir={sortDir} toggle={toggleSort}>
                ID
              </Th>
              <Th col="cliente" sortCol={sortCol} sortDir={sortDir} toggle={toggleSort}>
                Cliente
              </Th>
              <Th col="titulo" sortCol={sortCol} sortDir={sortDir} toggle={toggleSort}>
                Título
              </Th>
              <Th col="tipo" sortCol={sortCol} sortDir={sortDir} toggle={toggleSort}>
                Tipo
              </Th>
              <Th col="tecnico" sortCol={sortCol} sortDir={sortDir} toggle={toggleSort}>
                Técnico
              </Th>
              <Th col="aging" sortCol={sortCol} sortDir={sortDir} toggle={toggleSort} className="text-right">
                Aging
              </Th>
              <Th col="semUpdate" sortCol={sortCol} sortDir={sortDir} toggle={toggleSort} className="text-right">
                S/ update
              </Th>
              <Th col="prioridade" sortCol={sortCol} sortDir={sortDir} toggle={toggleSort}>
                Prio.
              </Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {ordenados.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                  Nenhum chamado nesse filtro.
                </td>
              </tr>
            ) : (
              ordenados.map((c) => {
                const cliente = mockClientes.find((x) => x.id === c.clienteId);
                const tec = mockUsuarios.find((x) => x.id === c.tecnicoId);
                const visual = getStatusVisual(c);
                return (
                  <tr
                    key={c.id}
                    onClick={() => abrir(c.id)}
                    className="cursor-pointer hover:bg-accent/40"
                  >
                    <td className="px-2 py-2">
                      <span className={cn("inline-block h-2 w-2 rounded-full", STATUS_DOT[visual])} />
                    </td>
                    <td className="px-2 py-2 font-mono text-xs font-semibold text-primary">{c.id}</td>
                    <td className="px-2 py-2 text-xs">{cliente?.nome}</td>
                    <td className="px-2 py-2 max-w-[280px] truncate" title={c.titulo}>
                      {c.titulo}
                    </td>
                    <td className="px-2 py-2 text-xs text-muted-foreground">
                      {c.tipoChamado.categoria}
                    </td>
                    <td className="px-2 py-2 text-xs">{tec?.nome.split(" ")[0]}</td>
                    <td className="px-2 py-2 text-right text-xs tabular-nums">
                      {calcularAging(c.dataAbertura)}d
                    </td>
                    <td className="px-2 py-2 text-right text-xs tabular-nums">
                      {calcularDiasSemUpdate(c.dataUltimaAtualizacao)}d
                    </td>
                    <td className="px-2 py-2 text-xs capitalize">{c.prioridade}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({
  children,
  col,
  sortCol,
  sortDir,
  toggle,
  className,
}: {
  children: React.ReactNode;
  col: ColKey;
  sortCol: ColKey;
  sortDir: "asc" | "desc";
  toggle: (col: ColKey) => void;
  className?: string;
}) {
  const active = sortCol === col;
  return (
    <th
      onClick={() => toggle(col)}
      className={cn(
        "cursor-pointer select-none px-2 py-2 text-left font-semibold",
        active && "text-foreground",
        className,
      )}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {active ? (
          sortDir === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </span>
    </th>
  );
}

function compare(a: Chamado, b: Chamado, col: ColKey): number {
  switch (col) {
    case "id":
      return a.id.localeCompare(b.id);
    case "cliente":
      return a.clienteId.localeCompare(b.clienteId);
    case "titulo":
      return a.titulo.localeCompare(b.titulo);
    case "tipo":
      return a.tipoChamado.categoria.localeCompare(b.tipoChamado.categoria);
    case "tecnico":
      return (a.tecnicoId ?? "").localeCompare(b.tecnicoId ?? "");
    case "aging":
      return calcularAging(a.dataAbertura) - calcularAging(b.dataAbertura);
    case "semUpdate":
      return (
        calcularDiasSemUpdate(a.dataUltimaAtualizacao) -
        calcularDiasSemUpdate(b.dataUltimaAtualizacao)
      );
    case "prioridade":
      return PRIO_ORDEM[a.prioridade] - PRIO_ORDEM[b.prioridade];
    case "visual": {
      const order: Record<StatusVisual, number> = { vermelho: 4, amarelo: 3, verde: 2, cinza: 1 };
      return order[getStatusVisual(a)] - order[getStatusVisual(b)];
    }
  }
}

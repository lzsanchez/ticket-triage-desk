import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  CalendarClock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subDays,
  differenceInCalendarDays,
  addDays,
  startOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useData } from "@/lib/store";
import { mockClientes } from "@/data/mockClientes";
import { cn } from "@/lib/utils";
import {
  ETAPAS_CANCELAMENTO,
  ETAPAS_ENTREGA,
  type FrequenciaAtualizacao,
  type Projeto,
  type TipoProjeto,
} from "@/types";
import { NovoProjetoDialog } from "@/components/gestao/NovoProjetoDialog";

export const Route = createFileRoute("/gestao-entrega")({
  component: () => (
    <AppShell>
      <GestaoEntrega />
    </AppShell>
  ),
});

const FREQ_LABEL: Record<FrequenciaAtualizacao, string> = {
  diaria: "Diária",
  a_cada_2_dias: "2 dias",
  semanal: "Semanal",
  quinzenal: "Quinzenal",
  conforme_necessario: "Conforme nec.",
};

const FREQ_DIAS: Record<FrequenciaAtualizacao, number> = {
  diaria: 1,
  a_cada_2_dias: 2,
  semanal: 7,
  quinzenal: 14,
  conforme_necessario: 0,
};

function GestaoEntrega() {
  const { projetos } = useData();
  const [tipoTab, setTipoTab] = useState<TipoProjeto>("entrega_link");
  const [novoOpen, setNovoOpen] = useState(false);

  const ativos = useMemo(
    () => projetos.filter((p) => !p.dataConclusao),
    [projetos],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Gestão de Entrega</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhamento de projetos de entrega de links e cancelamentos.
        </p>
      </div>

      {/* Seção 1 — KPIs e gráficos */}
      <SecaoMetricas projetos={projetos} />

      {/* Seção 2 — Tabs e Kanban */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <Tabs value={tipoTab} onValueChange={(v) => setTipoTab(v as TipoProjeto)}>
            <TabsList>
              <TabsTrigger value="entrega_link">Entregas de Link</TabsTrigger>
              <TabsTrigger value="cancelamentos">Cancelamentos</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => setNovoOpen(true)}>
            <Plus className="h-4 w-4" /> Novo Projeto
          </Button>
        </div>
        <KanbanProjetos
          projetos={ativos.filter((p) =>
            tipoTab === "entrega_link" ? p.tipo === "entrega_link" : p.tipo === "cancelamento",
          )}
          tipo={tipoTab}
        />
      </div>

      {/* Seção 3 — Calendário */}
      <CalendarioEntregas projetos={projetos} />

      <NovoProjetoDialog open={novoOpen} onOpenChange={setNovoOpen} tipoInicial={tipoTab} />
    </div>
  );
}

/* =================== Métricas =================== */

function SecaoMetricas({ projetos }: { projetos: Projeto[] }) {
  const hoje = new Date();
  const inicio7Dias = startOfDay(hoje);
  const fim7Dias = addDays(inicio7Dias, 7);

  const ativos = projetos.filter((p) => !p.dataConclusao);
  const concluidos30d = projetos.filter(
    (p) => p.dataConclusao && differenceInCalendarDays(hoje, p.dataConclusao) <= 30,
  );
  const noPrazo = concluidos30d.filter(
    (p) => p.prazoPrometido && p.dataConclusao! <= p.prazoPrometido,
  );
  const taxa =
    concluidos30d.length === 0
      ? 0
      : Math.round((noPrazo.length / concluidos30d.length) * 100);

  const tempoMedio =
    concluidos30d.length === 0
      ? 0
      : Math.round(
          concluidos30d.reduce(
            (acc, p) => acc + differenceInCalendarDays(p.dataConclusao!, p.dataCriacao),
            0,
          ) / concluidos30d.length,
        );

  const agendadasSemana = ativos.filter(
    (p) =>
      p.dataInstalacao &&
      p.dataInstalacao >= inicio7Dias &&
      p.dataInstalacao <= fim7Dias,
  ).length;

  const emRisco = ativos.filter(
    (p) =>
      p.prazoPrometido &&
      differenceInCalendarDays(p.prazoPrometido, hoje) < 3,
  ).length;

  const kpis = [
    { label: "Entregas ativas", value: ativos.filter((p) => p.tipo === "entrega_link").length, icon: TrendingUp },
    { label: "Instalações esta semana", value: agendadasSemana, icon: CalendarClock },
    { label: "Projetos em risco", value: emRisco, icon: AlertTriangle, danger: true },
    { label: "Taxa de conclusão no prazo", value: `${taxa}%`, icon: CheckCircle2 },
    { label: "Tempo médio de entrega", value: `${tempoMedio}d`, icon: Clock },
  ];

  // Dist por etapa (entregas)
  const distEtapa = ETAPAS_ENTREGA.map((e) => ({
    etapa: e,
    qtd: ativos.filter((p) => p.tipo === "entrega_link" && p.etapaAtual === e).length,
  }));

  // Concluídas vs criadas últimos 60 dias (semanal bucket)
  const buckets: { label: string; criadas: number; concluidas: number }[] = [];
  for (let i = 8; i >= 0; i--) {
    const fim = subDays(hoje, i * 7);
    const inicio = subDays(fim, 6);
    buckets.push({
      label: format(fim, "dd/MM"),
      criadas: projetos.filter(
        (p) => p.dataCriacao >= inicio && p.dataCriacao <= fim,
      ).length,
      concluidas: projetos.filter(
        (p) => p.dataConclusao && p.dataConclusao >= inicio && p.dataConclusao <= fim,
      ).length,
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-md",
                    k.danger ? "bg-destructive/10 text-destructive" : "bg-secondary text-secondary-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {k.label}
                  </p>
                  <p className="text-xl font-semibold">{k.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="mb-3 text-sm font-semibold">Projetos por etapa (Entregas)</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={distEtapa} layout="vertical" margin={{ left: 16 }}>
                <XAxis type="number" allowDecimals={false} stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis type="category" dataKey="etapa" width={130} stroke="var(--muted-foreground)" fontSize={11} />
                <ReTooltip cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="qtd" fill="var(--primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="mb-3 text-sm font-semibold">Concluídas vs criadas (últimos 60 dias)</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={buckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
                <ReTooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="criadas" stroke="var(--primary)" strokeWidth={2} />
                <Line type="monotone" dataKey="concluidas" stroke="var(--success)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* =================== Kanban =================== */

function KanbanProjetos({ projetos, tipo }: { projetos: Projeto[]; tipo: TipoProjeto }) {
  const { moverEtapaProjeto } = useData();
  const etapas = tipo === "entrega_link" ? ETAPAS_ENTREGA : ETAPAS_CANCELAMENTO;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [activeId, setActiveId] = useState<string | null>(null);

  const porEtapa = useMemo(() => {
    const m: Record<string, Projeto[]> = {};
    etapas.forEach((e) => (m[e] = []));
    projetos.forEach((p) => {
      if (m[p.etapaAtual]) m[p.etapaAtual].push(p);
      else m[etapas[0]].push(p);
    });
    return m;
  }, [projetos, etapas]);

  function onStart(e: DragStartEvent) {
    setActiveId(e.active.id as string);
  }
  function onEnd(e: DragEndEvent) {
    setActiveId(null);
    if (!e.over) return;
    const novaEtapa = (e.over.id as string).replace(/^etapa-/, "");
    const proj = projetos.find((p) => p.id === e.active.id);
    if (!proj || proj.etapaAtual === novaEtapa) return;
    moverEtapaProjeto(proj.id, novaEtapa);
  }

  const active = activeId ? projetos.find((p) => p.id === activeId) : null;

  return (
    <DndContext sensors={sensors} onDragStart={onStart} onDragEnd={onEnd}>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${etapas.length}, minmax(220px, 1fr))` }}>
        {etapas.map((etapa) => (
          <ColunaEtapa key={etapa} etapa={etapa} projetos={porEtapa[etapa] ?? []} />
        ))}
      </div>
      <DragOverlay>{active ? <CardProjeto projeto={active} dragging /> : null}</DragOverlay>
    </DndContext>
  );
}

function ColunaEtapa({ etapa, projetos }: { etapa: string; projetos: Projeto[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: `etapa-${etapa}` });
  return (
    <div className="flex flex-col rounded-md border border-border bg-muted/20">
      <div className="flex items-center justify-between border-b border-border bg-card px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground">{etapa}</p>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
          {projetos.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 p-2 min-h-[280px] transition-colors",
          isOver && "bg-accent/40",
        )}
      >
        {projetos.map((p) => (
          <DraggableProjeto key={p.id} projeto={p} />
        ))}
      </div>
    </div>
  );
}

function DraggableProjeto({ projeto }: { projeto: Projeto }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: projeto.id });
  const { abrir } = useProjetoModal();
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => abrir(projeto.id)}
      className={cn("touch-none cursor-pointer", isDragging && "opacity-30")}
    >
      <CardProjeto projeto={projeto} />
    </div>
  );
}

function statusPrazo(prazo: Date | null): "verde" | "amarelo" | "vermelho" | "neutro" {
  if (!prazo) return "neutro";
  const d = differenceInCalendarDays(prazo, new Date());
  if (d < 3) return "vermelho";
  if (d <= 7) return "amarelo";
  return "verde";
}

const PRAZO_BADGE: Record<string, string> = {
  verde: "bg-success/10 text-success border-success/30",
  amarelo: "bg-warning/10 text-warning border-warning/30",
  vermelho: "bg-destructive/10 text-destructive border-destructive/30",
  neutro: "bg-muted text-muted-foreground border-border",
};

function CardProjeto({ projeto, dragging }: { projeto: Projeto; dragging?: boolean }) {
  const { chamados } = useData();
  const cliente = mockClientes.find((c) => c.id === projeto.clienteId);
  const total = projeto.chamadosVinculados.length;
  const concluidos = projeto.chamadosVinculados.filter((id) => {
    const c = chamados.find((x) => x.id === id);
    return c?.statusInterno === "concluido";
  }).length;
  const pct = total === 0 ? 0 : Math.round((concluidos / total) * 100);
  const sp = statusPrazo(projeto.prazoPrometido);

  return (
    <div
      className={cn(
        "cursor-grab select-none rounded-md border border-border bg-card p-3 shadow-sm",
        dragging && "shadow-lg ring-2 ring-primary/30",
      )}
    >
      <p className="line-clamp-2 text-sm font-semibold text-foreground">{projeto.nome}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{cliente?.nome}</p>

      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          {concluidos} de {total} {total === 1 ? "item" : "itens"}
        </span>
        <span>{pct}%</span>
      </div>
      <Progress value={pct} className="mt-1 h-1.5" />

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className={cn("inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px]", PRAZO_BADGE[sp])}>
          <Clock className="h-2.5 w-2.5" />
          {projeto.prazoPrometido ? format(projeto.prazoPrometido, "dd/MM") : "Sem prazo"}
        </span>
        {projeto.frequenciaAtualizacao ? (
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            Atualizar: {FREQ_LABEL[projeto.frequenciaAtualizacao]}
          </span>
        ) : null}
        {projeto.dataInstalacao ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground">
            <CalendarDays className="h-2.5 w-2.5" />
            {format(projeto.dataInstalacao, "dd/MM")}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/* =================== Calendário =================== */

type EventoCal = {
  id: string;
  data: Date;
  tipo: "instalacao" | "prazo" | "atualizacao";
  projeto: Projeto;
  status?: "verde" | "amarelo" | "vermelho";
};

function gerarEventos(projetos: Projeto[]): EventoCal[] {
  const evs: EventoCal[] = [];
  projetos.forEach((p) => {
    if (p.dataConclusao) return;
    if (p.dataInstalacao) {
      evs.push({ id: `${p.id}-inst`, data: p.dataInstalacao, tipo: "instalacao", projeto: p });
    }
    if (p.prazoPrometido) {
      const d = differenceInCalendarDays(p.prazoPrometido, new Date());
      const status = d < 0 ? "vermelho" : d < 3 ? "amarelo" : "verde";
      evs.push({ id: `${p.id}-prazo`, data: p.prazoPrometido, tipo: "prazo", projeto: p, status });
    }
    if (p.frequenciaAtualizacao && FREQ_DIAS[p.frequenciaAtualizacao] > 0) {
      const proxima = addDays(new Date(), FREQ_DIAS[p.frequenciaAtualizacao]);
      evs.push({ id: `${p.id}-upd`, data: proxima, tipo: "atualizacao", projeto: p });
    }
  });
  return evs;
}

function CalendarioEntregas({ projetos }: { projetos: Projeto[] }) {
  const [refDate, setRefDate] = useState(new Date());
  const [filtro, setFiltro] = useState<"ambos" | "entrega_link" | "cancelamento">("ambos");
  const [view, setView] = useState<"mes" | "semana">("mes");

  const projetosFiltrados = useMemo(
    () => projetos.filter((p) => filtro === "ambos" || p.tipo === filtro),
    [projetos, filtro],
  );
  const eventos = useMemo(() => gerarEventos(projetosFiltrados), [projetosFiltrados]);

  const inicio = view === "mes" ? startOfWeek(startOfMonth(refDate), { weekStartsOn: 0 }) : startOfWeek(refDate, { weekStartsOn: 0 });
  const fim = view === "mes" ? endOfWeek(endOfMonth(refDate), { weekStartsOn: 0 }) : endOfWeek(refDate, { weekStartsOn: 0 });
  const dias: Date[] = [];
  for (let d = inicio; d <= fim; d = addDays(d, 1)) dias.push(d);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">Calendário de Entregas</p>
          <div className="flex items-center gap-2">
            <Tabs value={filtro} onValueChange={(v) => setFiltro(v as typeof filtro)}>
              <TabsList className="h-8">
                <TabsTrigger value="ambos" className="text-xs">Ambos</TabsTrigger>
                <TabsTrigger value="entrega_link" className="text-xs">Entregas</TabsTrigger>
                <TabsTrigger value="cancelamento" className="text-xs">Cancelamentos</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
              <TabsList className="h-8">
                <TabsTrigger value="mes" className="text-xs">Mês</TabsTrigger>
                <TabsTrigger value="semana" className="text-xs">Semana</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setRefDate(addMonths(refDate, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8" onClick={() => setRefDate(new Date())}>
              Hoje
            </Button>
            <span className="min-w-[140px] text-center text-sm font-medium">
              {format(refDate, "MMMM yyyy", { locale: ptBR })}
            </span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setRefDate(addMonths(refDate, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md border border-border bg-border">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
            <div key={d} className="bg-muted px-2 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {d}
            </div>
          ))}
          {dias.map((dia) => {
            const eventosDoDia = eventos.filter((e) => isSameDay(e.data, dia));
            const inMonth = view === "semana" || isSameMonth(dia, refDate);
            return (
              <div
                key={dia.toISOString()}
                className={cn(
                  "min-h-[88px] bg-card p-1.5",
                  !inMonth && "bg-muted/40 text-muted-foreground",
                  isSameDay(dia, new Date()) && "ring-1 ring-inset ring-primary",
                )}
              >
                <div className="mb-1 text-[11px] font-medium">{format(dia, "d")}</div>
                <div className="space-y-0.5">
                  {eventosDoDia.slice(0, 3).map((ev) => (
                    <EventoChip key={ev.id} ev={ev} />
                  ))}
                  {eventosDoDia.length > 3 ? (
                    <div className="text-[10px] text-muted-foreground">+{eventosDoDia.length - 3} mais</div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <LegendDot color="bg-[#008080] text-white" label="Instalação agendada" />
          <LegendDot color="bg-success text-success-foreground" label="Prazo no prazo" />
          <LegendDot color="bg-warning text-warning-foreground" label="Prazo próximo" />
          <LegendDot color="bg-destructive text-destructive-foreground" label="Prazo vencido" />
          <LegendDot color="bg-muted text-foreground border border-border" label="Atualização" />
        </div>
      </CardContent>
    </Card>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2.5 w-2.5 rounded-sm", color)} />
      {label}
    </span>
  );
}

const COR_EVENTO: Record<string, string> = {
  instalacao: "bg-[#008080] text-white",
  "prazo-verde": "bg-success text-success-foreground",
  "prazo-amarelo": "bg-warning text-warning-foreground",
  "prazo-vermelho": "bg-destructive text-destructive-foreground",
  atualizacao: "bg-muted text-foreground border border-border",
};

function EventoChip({ ev }: { ev: EventoCal }) {
  const key = ev.tipo === "prazo" ? `prazo-${ev.status}` : ev.tipo;
  const label =
    ev.tipo === "instalacao"
      ? `Instalação · ${ev.projeto.nome}`
      : ev.tipo === "prazo"
        ? `Prazo · ${ev.projeto.nome}`
        : `Atualizar · ${ev.projeto.nome}`;
  return (
    <div
      className={cn(
        "truncate rounded px-1 py-0.5 text-[10px] font-medium",
        COR_EVENTO[key],
      )}
      title={label}
    >
      {label}
    </div>
  );
}

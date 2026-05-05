import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Calendar,
  Clock,
  Layout,
  Monitor,
  Users,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/store";
import { MOCK_USERS } from "@/lib/users";
import { calcularAging, calcularDiasSemUpdate, cn, getStatusVisual } from "@/lib/utils";
import type { Chamado, Projeto, StatusVisual } from "@/types";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <AppShell>
      <Home />
    </AppShell>
  );
}

function Home() {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === "gestor" ? <HomeGestor /> : <HomeAnalista />;
}

// ─── helpers ────────────────────────────────────────────────────────────────

function saudacao(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Bom dia";
  if (h >= 12 && h < 18) return "Boa tarde";
  return "Boa noite";
}

function riscoProjeto(p: Projeto): StatusVisual {
  if (!p.prazoPrometido) return "verde";
  const dias = Math.floor(
    (p.prazoPrometido.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
  );
  if (dias < 0) return "vermelho";
  if (dias <= 3) return "amarelo";
  return "verde";
}

const STATUS_LABEL: Record<string, string> = {
  triagem: "Triagem",
  a_fazer_hoje: "A fazer hoje",
  em_tratativa: "Em tratativa",
  aguardando_terceiro: "Aguardando terceiro",
  aguardando_gestor: "Aguardando gestor",
  concluido: "Concluído",
};

const STATUS_COLORS: Record<string, string> = {
  a_fazer_hoje: "#6366f1",
  em_tratativa: "#22c55e",
  aguardando_terceiro: "#f59e0b",
  aguardando_gestor: "#ef4444",
  triagem: "#8b5cf6",
};

// ─── sub-components ──────────────────────────────────────────────────────────

function StatusDot({ status }: { status: StatusVisual }) {
  return (
    <span
      className={cn("inline-block h-2.5 w-2.5 rounded-full flex-shrink-0", {
        "bg-green-500": status === "verde",
        "bg-yellow-400": status === "amarelo",
        "bg-red-500": status === "vermelho",
        "bg-gray-400": status === "cinza",
      })}
    />
  );
}

function MiniStatusBar({ chamados }: { chamados: Chamado[] }) {
  const total = chamados.length;
  if (total === 0) return <div className="h-2 w-full rounded-full bg-muted" />;
  const order = [
    "aguardando_gestor",
    "aguardando_terceiro",
    "a_fazer_hoje",
    "em_tratativa",
    "triagem",
  ];
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
      {order.map((s) => {
        const count = chamados.filter((c) => c.statusInterno === s).length;
        if (!count) return null;
        return (
          <div
            key={s}
            style={{ width: `${(count / total) * 100}%`, backgroundColor: STATUS_COLORS[s] }}
          />
        );
      })}
    </div>
  );
}

function AlertCard({
  label,
  count,
  color,
  to,
}: {
  label: string;
  count: number;
  color: "red" | "yellow" | "blue" | "gray";
  to: string;
}) {
  const navigate = useNavigate();
  const colorMap = {
    red: "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950",
    yellow: "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950",
    blue: "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950",
    gray: "border-border bg-card",
  };
  const countColor = {
    red: "text-red-600 dark:text-red-400",
    yellow: "text-yellow-600 dark:text-yellow-400",
    blue: "text-blue-600 dark:text-blue-400",
    gray: "text-foreground",
  };
  return (
    <button
      onClick={() => navigate({ to: to as never })}
      className={cn(
        "flex flex-col gap-1 rounded-lg border p-4 text-left transition-shadow hover:shadow-sm",
        colorMap[color],
      )}
    >
      <span className={cn("text-3xl font-bold", countColor[color])}>{count}</span>
      <span className="text-sm leading-tight text-muted-foreground">{label}</span>
    </button>
  );
}

// ─── HOME ANALISTA ───────────────────────────────────────────────────────────

function HomeAnalista() {
  const { user } = useAuth();
  const { chamados, clientes } = useData();
  const navigate = useNavigate();

  const meusChamados = useMemo(
    () => chamados.filter((c) => c.tecnicoId === user!.id && c.statusInterno !== "concluido"),
    [chamados, user],
  );

  const parados = useMemo(
    () => meusChamados.filter((c) => calcularDiasSemUpdate(c.dataUltimaAtualizacao) > 7),
    [meusChamados],
  );

  const snoozadosVencidos = useMemo(
    () => meusChamados.filter((c) => c.verMaisTardeAte && c.verMaisTardeAte < new Date()),
    [meusChamados],
  );

  const aguardandoGestor = useMemo(
    () => meusChamados.filter((c) => c.statusInterno === "aguardando_gestor"),
    [meusChamados],
  );

  const cargaDonut = useMemo(() => {
    const groups: Record<string, number> = {};
    for (const c of meusChamados) {
      groups[c.statusInterno] = (groups[c.statusInterno] ?? 0) + 1;
    }
    return Object.entries(groups).map(([status, value]) => ({
      name: STATUS_LABEL[status] ?? status,
      value,
      status,
    }));
  }, [meusChamados]);

  const topClientes = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of meusChamados) {
      counts[c.clienteId] = (counts[c.clienteId] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([clienteId, count]) => ({
        cliente: clientes.find((c) => c.id === clienteId),
        count,
        clienteId,
      }));
  }, [meusChamados, clientes]);

  const proximosRetornos = useMemo(() => {
    const agora = new Date();
    return chamados
      .filter((c) => c.tecnicoId === user!.id && c.verMaisTardeAte && c.verMaisTardeAte > agora)
      .sort((a, b) => a.verMaisTardeAte!.getTime() - b.verMaisTardeAte!.getTime())
      .slice(0, 5);
  }, [chamados, user]);

  const atividadeRecente = useMemo(() => {
    const eventos: Array<{ data: Date; descricao: string; chamadoTitulo: string }> = [];
    for (const c of chamados) {
      for (const mov of c.historicoMovimentacoes) {
        if (mov.usuarioId === user!.id) {
          eventos.push({ data: mov.data, descricao: mov.descricao, chamadoTitulo: c.titulo });
        }
      }
    }
    return eventos.sort((a, b) => b.data.getTime() - a.data.getTime()).slice(0, 10);
  }, [chamados, user]);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Saudação */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {saudacao()}, {user!.name.split(" ")[0]}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground capitalize">
          Hoje é{" "}
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Cards de atenção */}
      {(parados.length > 0 || snoozadosVencidos.length > 0 || aguardandoGestor.length > 0) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {parados.length > 0 && (
            <AlertCard
              count={parados.length}
              label="chamados parados há mais de 7 dias"
              color="red"
              to="/minha-fila"
            />
          )}
          {snoozadosVencidos.length > 0 && (
            <AlertCard
              count={snoozadosVencidos.length}
              label="chamados que voltaram de 'Ver mais tarde'"
              color="yellow"
              to="/minha-fila"
            />
          )}
          {aguardandoGestor.length > 0 && (
            <AlertCard
              count={aguardandoGestor.length}
              label="chamados aguardando o gestor"
              color="blue"
              to="/minha-fila"
            />
          )}
        </div>
      )}

      {/* Minha Carga Hoje + Top Clientes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Donut */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Minha Carga Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            {meusChamados.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                Nenhum chamado ativo.
              </div>
            ) : (
              <div className="relative">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={cargaDonut}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      onClick={() => navigate({ to: "/minha-fila" })}
                      className="cursor-pointer"
                    >
                      {cargaDonut.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={STATUS_COLORS[entry.status] ?? "#94a3b8"}
                        />
                      ))}
                    </Pie>
                    <ReTooltip
                      formatter={(value, name) => [value, name]}
                    />
                    <Legend
                      formatter={(value) => (
                        <span className="text-xs text-foreground">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{meusChamados.length}</span>
                  <span className="text-xs text-muted-foreground">chamados</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top 5 clientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Meus Clientes com Mais Chamados</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {topClientes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum cliente com chamados ativos.</p>
            ) : (
              topClientes.map(({ cliente, count, clienteId }) => (
                <Link
                  key={clienteId}
                  to="/clientes/$id"
                  params={{ id: clienteId }}
                  className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-accent/60 transition-colors"
                >
                  <span className="text-sm font-medium">
                    {cliente?.nome ?? clienteId}
                  </span>
                  <Badge variant="secondary">{count}</Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Próximos retornos + Atividade recente */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Próximos retornos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Próximos Retornos de "Ver Mais Tarde"
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y">
            {proximosRetornos.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                Nenhum chamado aguardando retorno.
              </p>
            ) : (
              proximosRetornos.map((c) => {
                const clienteNome = clientes.find((cl) => cl.id === c.clienteId)?.nome ?? c.clienteId;
                return (
                  <div key={c.id} className="flex items-start justify-between py-3 gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.titulo}</p>
                      <p className="text-xs text-muted-foreground">{clienteNome}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      volta em{" "}
                      {formatDistanceToNow(c.verMaisTardeAte!, { locale: ptBR })}
                    </span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Atividade recente */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y max-h-72 overflow-y-auto">
            {atividadeRecente.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                Nenhuma atividade registrada.
              </p>
            ) : (
              atividadeRecente.map((ev, i) => (
                <div key={i} className="flex items-start gap-3 py-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">
                      {ev.chamadoTitulo}
                    </p>
                    <p className="text-sm">{ev.descricao}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {format(ev.data, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── HOME GESTOR ─────────────────────────────────────────────────────────────

function HomeGestor() {
  const [modo, setModo] = useState<"operacional" | "daily">("operacional");

  return modo === "daily" ? (
    <ModoDaily onVoltar={() => setModo("operacional")} />
  ) : (
    <ModoOperacional onDaily={() => setModo("daily")} />
  );
}

function ModoOperacional({ onDaily }: { onDaily: () => void }) {
  const { user } = useAuth();
  const { chamados, projetos, clientes } = useData();
  const navigate = useNavigate();

  const chamadosAtivos = useMemo(
    () => chamados.filter((c) => c.statusInterno !== "concluido"),
    [chamados],
  );

  const projetosAtivos = useMemo(
    () =>
      projetos.filter(
        (p) =>
          !p.arquivado && p.etapaAtual !== "Entregue" && p.etapaAtual !== "Concluído",
      ),
    [projetos],
  );

  const emTriagem = useMemo(
    () => chamados.filter((c) => c.statusInterno === "triagem"),
    [chamados],
  );

  const paradosTotal = useMemo(
    () => chamadosAtivos.filter((c) => calcularDiasSemUpdate(c.dataUltimaAtualizacao) > 7),
    [chamadosAtivos],
  );

  const projetosEmRisco = useMemo(
    () => projetosAtivos.filter((p) => riscoProjeto(p) !== "verde"),
    [projetosAtivos],
  );

  const snoozadosVencidos = useMemo(
    () => chamadosAtivos.filter((c) => c.verMaisTardeAte && c.verMaisTardeAte < new Date()),
    [chamadosAtivos],
  );

  const teamData = useMemo(
    () =>
      MOCK_USERS.map((u) => {
        const meus = chamadosAtivos.filter((c) => c.tecnicoId === u.id);
        const verdes = meus.filter((c) => getStatusVisual(c) === "verde").length;
        const amarelos = meus.filter((c) => getStatusVisual(c) === "amarelo").length;
        const vermelhos = meus.filter((c) => getStatusVisual(c) === "vermelho").length;
        return { user: u, chamados: meus, total: meus.length, verdes, amarelos, vermelhos };
      }),
    [chamadosAtivos],
  );

  const projetosPorEtapa = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of projetosAtivos) {
      counts[p.etapaAtual] = (counts[p.etapaAtual] ?? 0) + 1;
    }
    return Object.entries(counts).map(([etapa, total]) => ({ etapa, total }));
  }, [projetosAtivos]);

  const topClientes = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of chamadosAtivos) {
      counts[c.clienteId] = (counts[c.clienteId] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([clienteId, count]) => ({
        cliente: clientes.find((c) => c.id === clienteId),
        count,
        clienteId,
      }));
  }, [chamadosAtivos, clientes]);

  const agingBuckets = useMemo(() => {
    const buckets = [
      { label: "0-7d", min: 0, max: 7, total: 0 },
      { label: "8-15d", min: 8, max: 15, total: 0 },
      { label: "16-30d", min: 16, max: 30, total: 0 },
      { label: "31-60d", min: 31, max: 60, total: 0 },
      { label: "61-90d", min: 61, max: 90, total: 0 },
      { label: "90+d", min: 91, max: Infinity, total: 0 },
    ];
    for (const c of chamadosAtivos) {
      const aging = calcularAging(c.dataAbertura);
      const b = buckets.find((bk) => aging >= bk.min && aging <= bk.max);
      if (b) b.total++;
    }
    return buckets;
  }, [chamadosAtivos]);

  const atividadeEquipe = useMemo(() => {
    const eventos: Array<{
      data: Date;
      descricao: string;
      usuarioNome: string;
      chamadoTitulo: string;
    }> = [];
    for (const c of chamados) {
      for (const mov of c.historicoMovimentacoes) {
        const u = MOCK_USERS.find((u) => u.id === mov.usuarioId);
        eventos.push({
          data: mov.data,
          descricao: mov.descricao,
          usuarioNome: u?.name ?? mov.usuarioId,
          chamadoTitulo: c.titulo,
        });
      }
    }
    return eventos.sort((a, b) => b.data.getTime() - a.data.getTime()).slice(0, 20);
  }, [chamados]);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {saudacao()}, {user!.name.split(" ")[0]}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground capitalize">
            Hoje é {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            {" · "}
            Backlog: {chamadosAtivos.length} chamados · {projetosAtivos.length} projetos ativos
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={onDaily}>
          <Monitor className="h-4 w-4" />
          Modo Daily
        </Button>
      </div>

      {/* Alertas */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AlertCard
          count={emTriagem.length}
          label="chamados na triagem aguardando você"
          color={emTriagem.length > 0 ? "blue" : "gray"}
          to="/triagem"
        />
        <AlertCard
          count={paradosTotal.length}
          label="chamados parados há mais de 7 dias"
          color={paradosTotal.length > 0 ? "red" : "gray"}
          to="/filas-equipe"
        />
        <AlertCard
          count={projetosEmRisco.length}
          label="projetos com prazo vencido ou vencendo"
          color={projetosEmRisco.length > 0 ? "yellow" : "gray"}
          to="/gestao-entrega"
        />
        <AlertCard
          count={snoozadosVencidos.length}
          label="'Ver mais tarde' vencidos sem ação"
          color={snoozadosVencidos.length > 0 ? "yellow" : "gray"}
          to="/filas-equipe"
        />
      </div>

      {/* Visão da Equipe */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Visão da Equipe
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {teamData.map(({ user: u, chamados: meus, total, verdes, amarelos, vermelhos }) => (
            <Card key={u.id}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground flex-shrink-0">
                    {u.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium leading-tight truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{u.role}</p>
                  </div>
                  <span className="text-2xl font-bold">{total}</span>
                </div>

                <MiniStatusBar chamados={meus} />

                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    {verdes}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-yellow-400" />
                    {amarelos}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    {vermelhos}
                  </span>
                  <Link
                    to="/filas-equipe"
                    className="ml-auto flex items-center gap-1 text-primary hover:underline"
                  >
                    Ver fila <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Projetos + Top Clientes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Projetos em andamento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Projetos em Andamento por Etapa</CardTitle>
          </CardHeader>
          <CardContent>
            {projetosPorEtapa.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                Nenhum projeto ativo.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(120, projetosPorEtapa.length * 36)}>
                <BarChart
                  data={projetosPorEtapa}
                  layout="vertical"
                  onClick={() => navigate({ to: "/gestao-entrega" })}
                  className="cursor-pointer"
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="etapa"
                    tick={{ fontSize: 11 }}
                    width={130}
                  />
                  <ReTooltip />
                  <Bar dataKey="total" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top 5 clientes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 5 Clientes por Volume</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {topClientes.map(({ cliente, count, clienteId }, i) => (
              <Link
                key={clienteId}
                to="/clientes/$id"
                params={{ id: clienteId }}
                className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent/60 transition-colors"
              >
                <span className="text-xs font-mono text-muted-foreground w-4">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-medium truncate">
                  {cliente?.nome ?? clienteId}
                </span>
                <Badge variant="secondary">{count}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Aging do Backlog */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aging do Backlog</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={agingBuckets}
              onClick={() => navigate({ to: "/triagem" })}
              className="cursor-pointer"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={24} />
              <ReTooltip />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {agingBuckets.map((b, i) => (
                  <Cell
                    key={i}
                    fill={
                      b.min <= 7
                        ? "#22c55e"
                        : b.min <= 15
                          ? "#84cc16"
                          : b.min <= 30
                            ? "#f59e0b"
                            : b.min <= 60
                              ? "#f97316"
                              : "#ef4444"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Atividade da equipe */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Atividade Recente da Equipe
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y max-h-80 overflow-y-auto">
          {atividadeEquipe.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">Nenhuma atividade registrada.</p>
          ) : (
            atividadeEquipe.map((ev, i) => (
              <div key={i} className="flex items-start gap-3 py-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{ev.chamadoTitulo}</p>
                  <p className="text-sm">{ev.descricao}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    <span className="font-medium">{ev.usuarioNome}</span>
                    {" · "}
                    {format(ev.data, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── MODO DAILY ──────────────────────────────────────────────────────────────

function ModoDaily({ onVoltar }: { onVoltar: () => void }) {
  const { chamados, projetos, clientes } = useData();

  const chamadosAtivos = useMemo(
    () => chamados.filter((c) => c.statusInterno !== "concluido"),
    [chamados],
  );

  const projetosAtivos = useMemo(
    () =>
      projetos.filter(
        (p) => !p.arquivado && p.etapaAtual !== "Entregue" && p.etapaAtual !== "Concluído",
      ),
    [projetos],
  );

  const emTriagem = useMemo(
    () => chamados.filter((c) => c.statusInterno === "triagem"),
    [chamados],
  );
  const paradosTotal = useMemo(
    () => chamadosAtivos.filter((c) => calcularDiasSemUpdate(c.dataUltimaAtualizacao) > 7),
    [chamadosAtivos],
  );
  const projetosEmRisco = useMemo(
    () => projetosAtivos.filter((p) => riscoProjeto(p) !== "verde"),
    [projetosAtivos],
  );

  const teamData = useMemo(
    () =>
      MOCK_USERS.map((u) => {
        const meus = chamadosAtivos.filter((c) => c.tecnicoId === u.id);
        const verdes = meus.filter((c) => getStatusVisual(c) === "verde").length;
        const amarelos = meus.filter((c) => getStatusVisual(c) === "amarelo").length;
        const vermelhos = meus.filter((c) => getStatusVisual(c) === "vermelho").length;
        return { user: u, total: meus.length, verdes, amarelos, vermelhos };
      }),
    [chamadosAtivos],
  );

  const proximasEntregas = useMemo(
    () =>
      projetosAtivos
        .filter((p) => p.prazoPrometido)
        .sort((a, b) => a.prazoPrometido!.getTime() - b.prazoPrometido!.getTime())
        .slice(0, 5),
    [projetosAtivos],
  );

  return (
    <div className="flex min-h-screen flex-col bg-background p-6 gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Daily</p>
          <h1 className="text-xl font-bold">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR }).replace(/^\w/, (c) =>
              c.toUpperCase(),
            )}
          </h1>
          <p className="mt-1 text-3xl font-bold tracking-tight">
            {chamadosAtivos.length}{" "}
            <span className="text-muted-foreground text-xl font-normal">chamados</span>
            {"  ·  "}
            {projetosAtivos.length}{" "}
            <span className="text-muted-foreground text-xl font-normal">projetos ativos</span>
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 self-start" onClick={onVoltar}>
          <Layout className="h-4 w-4" />
          Modo operacional
        </Button>
      </div>

      {/* 3 colunas */}
      <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Col 1: Alertas */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
              <span className="text-4xl font-bold text-red-600 dark:text-red-400">
                {paradosTotal.length}
              </span>
              <p className="text-sm text-red-700 dark:text-red-300 leading-tight">
                chamados parados &gt;7 dias
              </p>
            </div>
            <div className="flex items-center gap-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
              <span className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">
                {projetosEmRisco.length}
              </span>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 leading-tight">
                projetos em risco
              </p>
            </div>
            <div className="flex items-center gap-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
              <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {emTriagem.length}
              </span>
              <p className="text-sm text-blue-700 dark:text-blue-300 leading-tight">
                na triagem pendente
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Col 2: Equipe */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Equipe
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {teamData.map(({ user: u, total, verdes, amarelos, vermelhos }) => (
              <div key={u.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                      {u.initials}
                    </div>
                    <span className="font-medium text-sm">{u.name.split(" ")[0]}</span>
                  </div>
                  <span className="text-2xl font-bold">{total}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="flex items-center gap-1 text-green-600">
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                    {verdes}
                  </span>
                  <span className="flex items-center gap-1 text-yellow-600">
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    {amarelos}
                  </span>
                  <span className="flex items-center gap-1 text-red-600">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    {vermelhos}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Col 3: Próximas Entregas */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Próximas Entregas
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {proximasEntregas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma entrega prevista.</p>
            ) : (
              proximasEntregas.map((p) => {
                const risco = riscoProjeto(p);
                const cliente = clientes.find((c) => c.id === p.clienteId);
                return (
                  <div
                    key={p.id}
                    className="flex items-start gap-3 rounded-md border p-3"
                  >
                    <StatusDot status={risco} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.nome}</p>
                      <p className="text-xs text-muted-foreground">{cliente?.nome}</p>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {p.prazoPrometido
                        ? format(p.prazoPrometido, "dd/MM", { locale: ptBR })
                        : "—"}
                    </p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

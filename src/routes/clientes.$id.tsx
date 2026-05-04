import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Check,
  ExternalLink,
  Pencil,
  X,
} from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { useData } from "@/lib/store";
import { calcularAging, cn, getStatusVisual } from "@/lib/utils";
import type { StatusVisual } from "@/types";

export const Route = createFileRoute("/clientes/$id")({
  component: () => (
    <AppShell>
      <ClienteDetalhePage />
    </AppShell>
  ),
});

const STATUS_LABEL: Record<string, string> = {
  triagem: "Triagem",
  a_fazer_hoje: "A fazer hoje",
  em_tratativa: "Em tratativa",
  aguardando_terceiro: "Aguardando terceiro",
  aguardando_gestor: "Aguardando gestor",
  concluido: "Concluído",
};

const CHART_COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#ec4899",
];

function StatusBolinha({ status }: { status: StatusVisual }) {
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

function ClienteDetalhePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { clientes, chamados, projetos, atualizarCliente } = useData();

  const [editandoObs, setEditandoObs] = useState(false);
  const [obsRascunho, setObsRascunho] = useState("");

  const cliente = clientes.find((c) => c.id === id);

  const chamadosCliente = useMemo(
    () => chamados.filter((c) => c.clienteId === id),
    [chamados, id],
  );
  const chamadosAbertos = useMemo(
    () => chamadosCliente.filter((c) => c.statusInterno !== "concluido"),
    [chamadosCliente],
  );
  const projetosCliente = useMemo(
    () => projetos.filter((p) => p.clienteId === id),
    [projetos, id],
  );
  const projetosAtivos = useMemo(
    () =>
      projetosCliente.filter(
        (p) => !p.arquivado && p.etapaAtual !== "Entregue" && p.etapaAtual !== "Concluído",
      ),
    [projetosCliente],
  );

  const agingMedio = useMemo(() => {
    if (chamadosAbertos.length === 0) return 0;
    return Math.round(
      chamadosAbertos.reduce((sum, c) => sum + calcularAging(c.dataAbertura), 0) /
        chamadosAbertos.length,
    );
  }, [chamadosAbertos]);

  const chamadosParados = useMemo(
    () =>
      chamadosAbertos.filter((c) => {
        const dias = Math.floor(
          (new Date().getTime() - c.dataUltimaAtualizacao.getTime()) / (1000 * 60 * 60 * 24),
        );
        return dias > 7;
      }),
    [chamadosAbertos],
  );

  const dadosDonut = useMemo(() => {
    const contagem = chamadosCliente.reduce<Record<string, number>>((acc, c) => {
      const cat = c.tipoChamado.categoria;
      acc[cat] = (acc[cat] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(contagem).map(([name, value]) => ({ name, value }));
  }, [chamadosCliente]);

  const dadosLinha = useMemo(() => {
    const hoje = new Date();
    return Array.from({ length: 13 }, (_, i) => {
      const semanas = 12 - i;
      const fim = subDays(hoje, semanas * 7);
      const inicio = startOfDay(subDays(fim, 6));
      const abertos = chamadosCliente.filter((c) => {
        const t = c.dataAbertura.getTime();
        return t >= inicio.getTime() && t <= fim.getTime();
      }).length;
      const fechados = chamadosCliente.filter((c) => {
        if (c.statusInterno !== "concluido") return false;
        const t = c.dataUltimaAtualizacao.getTime();
        return t >= inicio.getTime() && t <= fim.getTime();
      }).length;
      return {
        semana: format(fim, "dd/MM", { locale: ptBR }),
        Abertos: abertos,
        Fechados: fechados,
      };
    });
  }, [chamadosCliente]);

  const eventosTimeline = useMemo(() => {
    const eventos = [
      ...chamadosCliente.map((c) => ({
        data: c.dataAbertura,
        tipo: "chamado_aberto" as const,
        descricao: `Chamado aberto: ${c.titulo}`,
        id: `aberto-${c.id}`,
      })),
      ...chamadosCliente
        .filter((c) => c.statusInterno === "concluido")
        .map((c) => ({
          data: c.dataUltimaAtualizacao,
          tipo: "chamado_concluido" as const,
          descricao: `Chamado concluído: ${c.titulo}`,
          id: `concluido-${c.id}`,
        })),
      ...projetosCliente.map((p) => ({
        data: p.dataCriacao,
        tipo: "projeto_criado" as const,
        descricao: `Projeto criado: ${p.nome}`,
        id: `proj-${p.id}`,
      })),
    ];
    return eventos.sort((a, b) => b.data.getTime() - a.data.getTime());
  }, [chamadosCliente, projetosCliente]);

  if (!cliente) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <p className="text-muted-foreground">Cliente não encontrado.</p>
        <Button variant="outline" onClick={() => navigate({ to: "/clientes" })}>
          Voltar para Clientes
        </Button>
      </div>
    );
  }

  function salvarObservacoes() {
    atualizarCliente(id, { observacoes: obsRascunho });
    setEditandoObs(false);
  }

  const metricas = [
    { label: "Total de Chamados", valor: chamadosCliente.length },
    { label: "Chamados Abertos", valor: chamadosAbertos.length },
    { label: "Projetos Ativos", valor: projetosAtivos.length },
    { label: "Aging Médio", valor: agingMedio > 0 ? `${agingMedio}d` : "—" },
    {
      label: "Parados >7d",
      valor: chamadosParados.length,
      destaque: chamadosParados.length > 0,
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Breadcrumb / back */}
      <Button
        variant="ghost"
        size="sm"
        className="w-fit gap-2 -ml-2 text-muted-foreground"
        onClick={() => navigate({ to: "/clientes" })}
      >
        <ArrowLeft className="h-4 w-4" />
        Clientes
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{cliente.nome}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
            {cliente.entidadeGLPI}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 self-start">
          <ExternalLink className="h-3.5 w-3.5" />
          Ver no GLPI
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {metricas.map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground leading-tight">{m.label}</p>
              <p className={cn("mt-1 text-2xl font-bold", m.destaque && "text-red-500")}>
                {m.valor}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="chamados">
        <TabsList>
          <TabsTrigger value="chamados">
            Chamados
            {chamadosCliente.length > 0 && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold">
                {chamadosCliente.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="projetos">
            Projetos
            {projetosCliente.length > 0 && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold">
                {projetosCliente.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="observacoes">Observações</TabsTrigger>
        </TabsList>

        {/* Chamados */}
        <TabsContent value="chamados" className="mt-4">
          <div className="rounded-lg border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chamado</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead className="text-right">Aging</TableHead>
                  <TableHead className="text-center">Visual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chamadosCliente.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      Nenhum chamado para este cliente.
                    </TableCell>
                  </TableRow>
                ) : (
                  chamadosCliente.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium max-w-xs truncate">{c.titulo}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.tipoChamado.categoria}
                        {c.tipoChamado.subcategoria && ` / ${c.tipoChamado.subcategoria}`}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          {STATUS_LABEL[c.statusInterno] ?? c.statusInterno}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize text-sm">{c.prioridade}</TableCell>
                      <TableCell className="text-right text-sm">
                        {calcularAging(c.dataAbertura)}d
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <StatusBolinha status={getStatusVisual(c)} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Projetos */}
        <TabsContent value="projetos" className="mt-4">
          <div className="rounded-lg border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead className="text-right">Chamados</TableHead>
                  <TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projetosCliente.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      Nenhum projeto para este cliente.
                    </TableCell>
                  </TableRow>
                ) : (
                  projetosCliente.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.nome}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.tipo === "entrega_link" ? "Entrega Link" : "Cancelamento"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.arquivado ? "secondary" : "outline"} className="text-xs">
                          {p.arquivado ? "Arquivado" : p.etapaAtual}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{p.chamadosVinculados.length}</TableCell>
                      <TableCell className="text-sm">
                        {format(p.dataCriacao, "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="historico" className="mt-4">
          <div className="rounded-lg border bg-card divide-y">
            {eventosTimeline.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                Nenhuma atividade registrada.
              </div>
            ) : (
              eventosTimeline.map((ev) => (
                <div key={ev.id} className="flex items-start gap-3 p-4">
                  <span
                    className={cn("mt-1 h-2 w-2 rounded-full flex-shrink-0", {
                      "bg-blue-500": ev.tipo === "chamado_aberto",
                      "bg-green-500": ev.tipo === "chamado_concluido",
                      "bg-purple-500": ev.tipo === "projeto_criado",
                    })}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{ev.descricao}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {format(ev.data, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Observações */}
        <TabsContent value="observacoes" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Observações</CardTitle>
              {!editandoObs ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    setObsRascunho(cliente.observacoes ?? "");
                    setEditandoObs(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditandoObs(false)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" className="gap-2" onClick={salvarObservacoes}>
                    <Check className="h-3.5 w-3.5" />
                    Salvar
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {editandoObs ? (
                <Textarea
                  value={obsRascunho}
                  onChange={(e) => setObsRascunho(e.target.value)}
                  rows={6}
                  placeholder="Adicione informações sobre este cliente..."
                  className="resize-none"
                />
              ) : (
                <p className="whitespace-pre-wrap text-sm text-muted-foreground min-h-[80px]">
                  {cliente.observacoes || "Nenhuma observação registrada."}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição por Tipo de Chamado</CardTitle>
          </CardHeader>
          <CardContent>
            {dadosDonut.length === 0 ? (
              <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
                Sem dados suficientes.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={dadosDonut}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {dadosDonut.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <ReTooltip />
                  <Legend
                    formatter={(value) => (
                      <span className="text-xs text-foreground">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Chamados — Últimas 13 Semanas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dadosLinha}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="semana" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} width={24} />
                <ReTooltip />
                <Legend
                  formatter={(value) => (
                    <span className="text-xs text-foreground">{value}</span>
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="Abertos"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Fechados"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

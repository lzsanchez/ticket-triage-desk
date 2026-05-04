import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUpDown, Building2, Grid3x3, List, Plus, Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

import { useData } from "@/lib/store";
import { calcularAging, cn, getStatusVisual } from "@/lib/utils";
import type { StatusVisual } from "@/types";

export const Route = createFileRoute("/clientes")({
  component: () => (
    <AppShell>
      <ClientesPage />
    </AppShell>
  ),
});

type OrdemCliente = "mais_chamados" | "alfabetica" | "mais_abertos" | "mais_projetos" | "aging_medio";
type ModoVisualizacao = "tabela" | "cards";
type ColunaSortable = "nome" | "totalChamados" | "chamadosAbertos" | "projetosAtivos" | "agingMedio" | "ultimaAtividade";

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

function SortHeader({
  label,
  coluna,
  ativa,
  asc,
  onToggle,
  className,
}: {
  label: string;
  coluna: ColunaSortable;
  ativa: ColunaSortable;
  asc: boolean;
  onToggle: (c: ColunaSortable) => void;
  className?: string;
}) {
  return (
    <button
      className={cn("flex items-center gap-1 font-medium hover:text-foreground", className)}
      onClick={() => onToggle(coluna)}
    >
      {label}
      <ArrowUpDown className={cn("h-3 w-3", ativa === coluna ? "opacity-100" : "opacity-40")} />
    </button>
  );
}

function ClientesPage() {
  const { clientes, chamados, projetos, criarCliente } = useData();

  const [busca, setBusca] = useState("");
  const [modo, setModo] = useState<ModoVisualizacao>("tabela");
  const [ordenarPor, setOrdenarPor] = useState<OrdemCliente>("mais_chamados");
  const [colunaSort, setColunaSort] = useState<ColunaSortable>("totalChamados");
  const [sortAsc, setSortAsc] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);

  const [novoNome, setNovoNome] = useState("");
  const [novoGLPI, setNovoGLPI] = useState("MobDesk > Mobit Soluções > Clientes > ");
  const [novoObs, setNovoObs] = useState("");

  const clientesComMetricas = useMemo(() => {
    return clientes.map((cliente) => {
      const chamadosCliente = chamados.filter((c) => c.clienteId === cliente.id);
      const chamadosAbertos = chamadosCliente.filter((c) => c.statusInterno !== "concluido");
      const projetosAtivos = projetos.filter(
        (p) =>
          p.clienteId === cliente.id &&
          !p.arquivado &&
          p.etapaAtual !== "Entregue" &&
          p.etapaAtual !== "Concluído",
      );

      const agingMedio =
        chamadosAbertos.length > 0
          ? Math.round(
              chamadosAbertos.reduce((sum, c) => sum + calcularAging(c.dataAbertura), 0) /
                chamadosAbertos.length,
            )
          : 0;

      const ultimaAtividade =
        chamadosCliente.length > 0
          ? new Date(Math.max(...chamadosCliente.map((c) => c.dataUltimaAtualizacao.getTime())))
          : null;

      let statusGeral: StatusVisual = "verde";
      for (const c of chamadosAbertos) {
        const sv = getStatusVisual(c);
        if (sv === "vermelho") {
          statusGeral = "vermelho";
          break;
        }
        if (sv === "amarelo") statusGeral = "amarelo";
      }

      return {
        ...cliente,
        totalChamados: chamadosCliente.length,
        chamadosAbertos: chamadosAbertos.length,
        projetosAtivos: projetosAtivos.length,
        agingMedio,
        ultimaAtividade,
        statusGeral,
      };
    });
  }, [clientes, chamados, projetos]);

  const clientesFiltrados = useMemo(() => {
    const result = clientesComMetricas.filter((c) =>
      c.nome.toLowerCase().includes(busca.toLowerCase()),
    );

    if (modo === "cards") {
      switch (ordenarPor) {
        case "mais_chamados":
          result.sort((a, b) => b.totalChamados - a.totalChamados);
          break;
        case "alfabetica":
          result.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
          break;
        case "mais_abertos":
          result.sort((a, b) => b.chamadosAbertos - a.chamadosAbertos);
          break;
        case "mais_projetos":
          result.sort((a, b) => b.projetosAtivos - a.projetosAtivos);
          break;
        case "aging_medio":
          result.sort((a, b) => b.agingMedio - a.agingMedio);
          break;
      }
    } else {
      result.sort((a, b) => {
        let diff = 0;
        switch (colunaSort) {
          case "nome":
            diff = a.nome.localeCompare(b.nome, "pt-BR");
            break;
          case "totalChamados":
            diff = a.totalChamados - b.totalChamados;
            break;
          case "chamadosAbertos":
            diff = a.chamadosAbertos - b.chamadosAbertos;
            break;
          case "projetosAtivos":
            diff = a.projetosAtivos - b.projetosAtivos;
            break;
          case "agingMedio":
            diff = a.agingMedio - b.agingMedio;
            break;
          case "ultimaAtividade":
            diff =
              (a.ultimaAtividade?.getTime() ?? 0) - (b.ultimaAtividade?.getTime() ?? 0);
            break;
        }
        return sortAsc ? diff : -diff;
      });
    }

    return result;
  }, [clientesComMetricas, busca, modo, ordenarPor, colunaSort, sortAsc]);

  function toggleColuna(col: ColunaSortable) {
    if (colunaSort === col) {
      setSortAsc((v) => !v);
    } else {
      setColunaSort(col);
      setSortAsc(false);
    }
  }

  function handleCriarCliente() {
    if (!novoNome.trim()) return;
    criarCliente({
      nome: novoNome.trim(),
      entidadeGLPI: novoGLPI.trim(),
      observacoes: novoObs.trim() || undefined,
    });
    setNovoNome("");
    setNovoGLPI("MobDesk > Mobit Soluções > Clientes > ");
    setNovoObs("");
    setModalAberto(false);
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Base de Clientes</h1>
          <p className="text-sm text-muted-foreground">
            {clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? "s" : ""} cadastrado
            {clientesFiltrados.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setModalAberto(true)} className="gap-2 self-start">
          <Plus className="h-4 w-4" />
          Adicionar Cliente
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            className="pl-9"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <Select value={ordenarPor} onValueChange={(v) => setOrdenarPor(v as OrdemCliente)}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mais_chamados">Mais chamados</SelectItem>
            <SelectItem value="alfabetica">Ordem alfabética</SelectItem>
            <SelectItem value="mais_abertos">Mais chamados abertos</SelectItem>
            <SelectItem value="mais_projetos">Mais projetos ativos</SelectItem>
            <SelectItem value="aging_medio">Aging médio mais alto</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex rounded-md border overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            className={cn("rounded-none px-3", modo === "tabela" && "bg-accent")}
            onClick={() => setModo("tabela")}
            title="Modo tabela"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("rounded-none border-l px-3", modo === "cards" && "bg-accent")}
            onClick={() => setModo("cards")}
            title="Modo cards"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Modo tabela */}
      {modo === "tabela" && (
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortHeader
                    label="Nome do Cliente"
                    coluna="nome"
                    ativa={colunaSort}
                    asc={sortAsc}
                    onToggle={toggleColuna}
                  />
                </TableHead>
                <TableHead className="text-right">
                  <SortHeader
                    label="Total"
                    coluna="totalChamados"
                    ativa={colunaSort}
                    asc={sortAsc}
                    onToggle={toggleColuna}
                    className="ml-auto"
                  />
                </TableHead>
                <TableHead className="text-right">
                  <SortHeader
                    label="Abertos"
                    coluna="chamadosAbertos"
                    ativa={colunaSort}
                    asc={sortAsc}
                    onToggle={toggleColuna}
                    className="ml-auto"
                  />
                </TableHead>
                <TableHead className="text-right">
                  <SortHeader
                    label="Projetos"
                    coluna="projetosAtivos"
                    ativa={colunaSort}
                    asc={sortAsc}
                    onToggle={toggleColuna}
                    className="ml-auto"
                  />
                </TableHead>
                <TableHead className="text-right">
                  <SortHeader
                    label="Aging Médio"
                    coluna="agingMedio"
                    ativa={colunaSort}
                    asc={sortAsc}
                    onToggle={toggleColuna}
                    className="ml-auto"
                  />
                </TableHead>
                <TableHead>
                  <SortHeader
                    label="Última Atividade"
                    coluna="ultimaAtividade"
                    ativa={colunaSort}
                    asc={sortAsc}
                    onToggle={toggleColuna}
                  />
                </TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientesFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-14 text-center text-muted-foreground">
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                clientesFiltrados.map((cliente) => (
                  <TableRow key={cliente.id} className="cursor-pointer">
                    <TableCell className="font-medium">
                      <Link
                        to="/clientes/$id"
                        params={{ id: cliente.id }}
                        className="hover:underline"
                      >
                        {cliente.nome}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">{cliente.totalChamados}</TableCell>
                    <TableCell className="text-right">{cliente.chamadosAbertos}</TableCell>
                    <TableCell className="text-right">{cliente.projetosAtivos}</TableCell>
                    <TableCell className="text-right">
                      {cliente.agingMedio > 0 ? `${cliente.agingMedio}d` : "—"}
                    </TableCell>
                    <TableCell>
                      {cliente.ultimaAtividade
                        ? format(cliente.ultimaAtividade, "dd/MM/yyyy", { locale: ptBR })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <StatusBolinha status={cliente.statusGeral} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modo cards */}
      {modo === "cards" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {clientesFiltrados.length === 0 ? (
            <div className="col-span-full py-16 text-center text-muted-foreground">
              Nenhum cliente encontrado.
            </div>
          ) : (
            clientesFiltrados.map((cliente) => (
              <Link key={cliente.id} to="/clientes/$id" params={{ id: cliente.id }}>
                <Card className="cursor-pointer transition-shadow hover:shadow-md h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-base leading-tight">
                          {cliente.nome}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {cliente.entidadeGLPI}
                        </p>
                      </div>
                      <StatusBolinha status={cliente.statusGeral} />
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-2xl font-bold">{cliente.chamadosAbertos}</p>
                        <p className="text-[11px] text-muted-foreground leading-tight">Abertos</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{cliente.projetosAtivos}</p>
                        <p className="text-[11px] text-muted-foreground leading-tight">Projetos</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {cliente.agingMedio > 0 ? `${cliente.agingMedio}d` : "—"}
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-tight">Aging</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Modal: Adicionar Cliente */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Adicionar Cliente
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="novo-nome">Nome *</Label>
              <Input
                id="novo-nome"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder="Ex: Empresa XYZ"
                onKeyDown={(e) => e.key === "Enter" && handleCriarCliente()}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="novo-glpi">Entidade GLPI</Label>
              <Input
                id="novo-glpi"
                value={novoGLPI}
                onChange={(e) => setNovoGLPI(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="novo-obs">Observações</Label>
              <Textarea
                id="novo-obs"
                value={novoObs}
                onChange={(e) => setNovoObs(e.target.value)}
                placeholder="Informações adicionais sobre o cliente..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCriarCliente} disabled={!novoNome.trim()}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

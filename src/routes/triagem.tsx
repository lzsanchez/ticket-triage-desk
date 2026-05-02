import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/store";
import { mockClientes } from "@/data/mockClientes";
import { calcularAging, calcularDiasSemUpdate } from "@/lib/utils";
import type { Chamado, Prioridade } from "@/types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FiltrosMultiselect } from "@/components/triagem/FiltrosMultiselect";
import { VincularProjetoDialog } from "@/components/triagem/VincularProjetoDialog";
import { CheckCircle2, Inbox, Link2, Clock, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/triagem")({
  component: TriagemPage,
});

const TECNICOS = [
  { id: "luciano", nome: "Luciano Sanchez" },
  { id: "pedro", nome: "Pedro Melo" },
  { id: "priscila", nome: "Priscila Guanaz" },
];

const FAIXAS_AGING = [
  { value: "0-7", label: "0-7 dias" },
  { value: "8-30", label: "8-30 dias" },
  { value: "30+", label: "30+ dias" },
];

function faixaDoAging(dias: number): string {
  if (dias <= 7) return "0-7";
  if (dias <= 30) return "8-30";
  return "30+";
}

function TriagemPage() {
  return (
    <AppShell>
      <Triagem />
    </AppShell>
  );
}

function Triagem() {
  const { user } = useAuth();
  const { chamados } = useData();
  const [filtroClientes, setFiltroClientes] = useState<string[]>([]);
  const [filtroTipos, setFiltroTipos] = useState<string[]>([]);
  const [filtroAging, setFiltroAging] = useState<string[]>([]);
  const [vincularChamado, setVincularChamado] = useState<Chamado | null>(null);

  if (!user) return null;
  if (user.role !== "gestor") return <Navigate to="/" />;

  const naTriagem = useMemo(
    () => chamados.filter((c) => c.statusInterno === "triagem" || c.tecnicoId === null),
    [chamados],
  );

  const opcoesClientes = useMemo(
    () => mockClientes.map((c) => ({ value: c.id, label: c.nome })),
    [],
  );
  const opcoesTipos = useMemo(() => {
    const set = new Set<string>();
    naTriagem.forEach((c) => set.add(c.tipoChamado.categoria));
    return Array.from(set).map((v) => ({ value: v, label: v }));
  }, [naTriagem]);

  const filtrados = useMemo(() => {
    return naTriagem
      .filter((c) => filtroClientes.length === 0 || filtroClientes.includes(c.clienteId))
      .filter((c) => filtroTipos.length === 0 || filtroTipos.includes(c.tipoChamado.categoria))
      .filter((c) => {
        if (filtroAging.length === 0) return true;
        return filtroAging.includes(faixaDoAging(calcularAging(c.dataAbertura)));
      })
      .sort((a, b) => calcularAging(b.dataAbertura) - calcularAging(a.dataAbertura));
  }, [naTriagem, filtroClientes, filtroTipos, filtroAging]);

  function limparFiltros() {
    setFiltroClientes([]);
    setFiltroTipos([]);
    setFiltroAging([]);
  }

  const temFiltro = filtroClientes.length + filtroTipos.length + filtroAging.length > 0;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Porta de entrada</p>
          <div className="mt-1 flex items-baseline gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Triagem</h1>
            <span className="text-2xl font-semibold text-muted-foreground">
              ({naTriagem.length} {naTriagem.length === 1 ? "chamado aguardando" : "chamados aguardando"})
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Chamados sem técnico ou sem destino definido. Designe e priorize.
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
          label="Aging"
          options={FAIXAS_AGING}
          selected={filtroAging}
          onChange={setFiltroAging}
        />
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <span>{filtrados.length} de {naTriagem.length}</span>
          {temFiltro ? (
            <Button variant="ghost" size="sm" className="h-8" onClick={limparFiltros}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Limpar
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {filtrados.length === 0 ? (
          <EmptyState filtrado={temFiltro && naTriagem.length > 0} />
        ) : (
          filtrados.map((c) => (
            <CardTriagem key={c.id} chamado={c} onVincular={() => setVincularChamado(c)} />
          ))
        )}
      </div>

      <VincularProjetoDialog
        chamado={vincularChamado}
        open={vincularChamado !== null}
        onOpenChange={(o) => !o && setVincularChamado(null)}
      />
    </div>
  );
}

function EmptyState({ filtrado }: { filtrado: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border bg-card py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <Inbox className="h-6 w-6" />
      </div>
      <p className="mt-3 text-base font-medium text-foreground">
        {filtrado ? "Nenhum chamado nesse filtro." : "Tudo triado. Boa!"}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {filtrado
          ? "Ajuste os filtros para ver outros chamados na fila de triagem."
          : "Os próximos chamados sem técnico aparecem aqui."}
      </p>
    </div>
  );
}

function CardTriagem({ chamado, onVincular }: { chamado: Chamado; onVincular: () => void }) {
  const { atribuirTecnico, setPrioridade, concluirTriagem } = useData();
  const { user } = useAuth();
  const autorId = user?.id ?? "luciano";
  const cliente = mockClientes.find((c) => c.id === chamado.clienteId);
  const aging = calcularAging(chamado.dataAbertura);
  const semUpdate = calcularDiasSemUpdate(chamado.dataUltimaAtualizacao);

  const podeConcluir = chamado.tecnicoId !== null;

  return (
    <article className="rounded-md border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow">
      <div className="flex items-start gap-4">
        <div className="flex flex-col">
          <span className="font-mono text-sm font-semibold text-primary">{chamado.id}</span>
          <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {aging === 0 ? "Hoje" : `${aging}d`}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold leading-tight text-foreground">{chamado.titulo}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
            <span className="font-medium text-foreground">{cliente?.nome ?? "—"}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{cliente?.entidadeGLPI}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 font-medium text-secondary-foreground">
              {chamado.tipoChamado.categoria}
              {chamado.tipoChamado.subcategoria ? ` · ${chamado.tipoChamado.subcategoria}` : ""}
            </span>
            <span className="text-muted-foreground">Aberto há {aging} {aging === 1 ? "dia" : "dias"}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">
              Atualizado há {semUpdate} {semUpdate === 1 ? "dia" : "dias"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <Select
          value={chamado.tecnicoId ?? ""}
          onValueChange={(v) => atribuirTecnico(chamado.id, v, autorId)}
        >
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="Atribuir a..." />
          </SelectTrigger>
          <SelectContent>
            {TECNICOS.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={chamado.prioridade}
          onValueChange={(v) => setPrioridade(chamado.id, v as Prioridade)}
        >
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="baixa">Baixa</SelectItem>
            <SelectItem value="media">Média</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="critica">Crítica</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" className="h-9" onClick={onVincular}>
          <Link2 className="h-4 w-4 mr-1.5" />
          {chamado.projetoId ? "Trocar projeto" : "Vincular a projeto"}
        </Button>

        <div className="ml-auto">
          <Button
            size="sm"
            className="h-9"
            disabled={!podeConcluir}
            onClick={() => concluirTriagem(chamado.id, autorId)}
          >
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            Concluir triagem
          </Button>
        </div>
      </div>
    </article>
  );
}

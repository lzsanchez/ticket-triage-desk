import { useMemo, useState } from "react";
import {
  Archive,
  CalendarDays,
  Check,
  Clock,
  ExternalLink,
  History,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import { differenceInCalendarDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { useProjetoModal } from "@/lib/projetoModal";
import { useData } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useChamadoModal } from "@/lib/chamadoModal";
import { mockClientes } from "@/data/mockClientes";
import { mockUsuarios } from "@/data/mockUsuarios";
import { cn, getStatusVisual, calcularAging } from "@/lib/utils";
import {
  ETAPAS_CANCELAMENTO,
  ETAPAS_ENTREGA,
  type EventoProjeto,
  type FrequenciaAtualizacao,
  type Projeto,
} from "@/types";

const FREQ_LABEL: Record<FrequenciaAtualizacao, string> = {
  diaria: "Diária",
  a_cada_2_dias: "A cada 2 dias",
  semanal: "Semanal",
  quinzenal: "Quinzenal",
  conforme_necessario: "Conforme necessário",
};

const FREQ_DIAS: Record<FrequenciaAtualizacao, number> = {
  diaria: 1,
  a_cada_2_dias: 2,
  semanal: 7,
  quinzenal: 14,
  conforme_necessario: 0,
};

const STATUS_VISUAL_DOT: Record<string, string> = {
  verde: "bg-success",
  amarelo: "bg-warning",
  vermelho: "bg-destructive",
  cinza: "bg-muted-foreground/60",
};

export function ProjetoDetailsModal() {
  const { abertoId, fechar } = useProjetoModal();
  const { projetos } = useData();
  const projeto = useMemo(
    () => projetos.find((p) => p.id === abertoId) ?? null,
    [projetos, abertoId],
  );

  return (
    <Sheet open={!!projeto} onOpenChange={(o) => !o && fechar()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-none md:max-w-[60vw] overflow-y-auto p-0"
      >
        {projeto ? <Conteudo projeto={projeto} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function statusPrazo(prazo: Date | null | undefined) {
  if (!prazo) return { cor: "bg-muted text-muted-foreground border-border", label: "Sem prazo" };
  const d = differenceInCalendarDays(prazo, new Date());
  if (d < 0)
    return {
      cor: "bg-destructive/10 text-destructive border-destructive/30",
      label: `Atrasado ${Math.abs(d)}d`,
    };
  if (d < 3)
    return { cor: "bg-destructive/10 text-destructive border-destructive/30", label: `${d}d restantes` };
  if (d <= 7)
    return { cor: "bg-warning/10 text-warning border-warning/30", label: `${d}d restantes` };
  return { cor: "bg-success/10 text-success border-success/30", label: `${d}d restantes` };
}

function Conteudo({ projeto }: { projeto: Projeto }) {
  const { user } = useAuth();
  const autorId = user?.id ?? "luciano";
  const {
    chamados,
    atualizarProjeto,
    moverEtapaProjeto,
    removerChamadoProjeto,
    vincularProjeto,
    registrarAtualizacaoProjeto,
    adicionarObservacaoProjeto,
    arquivarProjeto,
  } = useData();
  const { abrir: abrirChamado } = useChamadoModal();
  const { fechar } = useProjetoModal();

  const cliente = mockClientes.find((c) => c.id === projeto.clienteId);
  const etapas = projeto.tipo === "entrega_link" ? ETAPAS_ENTREGA : ETAPAS_CANCELAMENTO;
  const idxEtapa = (etapas as readonly string[]).indexOf(projeto.etapaAtual);

  const itensProjeto = chamados.filter((c) => projeto.chamadosVinculados.includes(c.id));
  const concluidos = itensProjeto.filter((c) => c.statusInterno === "concluido").length;
  const pct =
    projeto.chamadosVinculados.length === 0
      ? 0
      : Math.round((concluidos / projeto.chamadosVinculados.length) * 100);

  // Edição inline do nome
  const [editandoNome, setEditandoNome] = useState(false);
  const [nomeTmp, setNomeTmp] = useState(projeto.nome);

  // Observação
  const [obsTmp, setObsTmp] = useState("");
  // Atualização
  const [atualizacaoTexto, setAtualizacaoTexto] = useState("");
  // Confirmação remoção
  const [removerId, setRemoverId] = useState<string | null>(null);
  // Adicionar chamados
  const [addOpen, setAddOpen] = useState(false);
  // Arquivar
  const [arquivarOpen, setArquivarOpen] = useState(false);

  const sp = statusPrazo(projeto.prazoPrometido);

  // Próxima atualização
  const proximaAtualizacao = useMemo(() => {
    if (!projeto.frequenciaAtualizacao) return null;
    const dias = FREQ_DIAS[projeto.frequenciaAtualizacao];
    if (dias === 0) return null;
    const base = projeto.ultimaAtualizacaoRegistrada ?? projeto.dataCriacao;
    const next = new Date(base);
    next.setDate(next.getDate() + dias);
    return next;
  }, [projeto]);

  const atrasoAtt = proximaAtualizacao
    ? differenceInCalendarDays(new Date(), proximaAtualizacao)
    : 0;

  const historico: EventoProjeto[] = projeto.historico ?? [];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-muted/30 px-6 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {editandoNome ? (
              <div className="flex items-center gap-2">
                <Input
                  value={nomeTmp}
                  onChange={(e) => setNomeTmp(e.target.value)}
                  className="h-8 text-lg font-semibold"
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => {
                    if (nomeTmp.trim() && nomeTmp !== projeto.nome) {
                      atualizarProjeto(
                        projeto.id,
                        { nome: nomeTmp.trim() },
                        autorId,
                        `Nome alterado para "${nomeTmp.trim()}".`,
                      );
                    }
                    setEditandoNome(false);
                  }}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => {
                    setNomeTmp(projeto.nome);
                    setEditandoNome(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="truncate text-2xl font-semibold tracking-tight">{projeto.nome}</h2>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => setEditandoNome(true)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{cliente?.nome ?? "—"}</span>
              {cliente?.entidadeGLPI ? (
                <span className="ml-2 text-xs">· {cliente.entidadeGLPI}</span>
              ) : null}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={fechar}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant={projeto.tipo === "entrega_link" ? "default" : "secondary"}>
            {projeto.tipo === "entrega_link" ? "Entrega de Link" : "Cancelamento"}
          </Badge>
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
            Etapa: {projeto.etapaAtual}
          </Badge>
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs",
                  sp.cor,
                )}
              >
                <CalendarDays className="h-3 w-3" />
                Prazo: {projeto.prazoPrometido ? format(projeto.prazoPrometido, "dd/MM/yyyy") : "—"}
                <span className="ml-1 opacity-70">({sp.label})</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={projeto.prazoPrometido ?? undefined}
                onSelect={(d) =>
                  d &&
                  atualizarProjeto(
                    projeto.id,
                    { prazoPrometido: d },
                    autorId,
                    `Prazo alterado para ${format(d, "dd/MM/yyyy")}.`,
                  )
                }
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          <Select
            value={projeto.frequenciaAtualizacao ?? "conforme_necessario"}
            onValueChange={(v) =>
              atualizarProjeto(
                projeto.id,
                { frequenciaAtualizacao: v as FrequenciaAtualizacao },
                autorId,
                `Frequência alterada para "${FREQ_LABEL[v as FrequenciaAtualizacao]}".`,
              )
            }
          >
            <SelectTrigger className="h-7 w-auto gap-1 px-2 text-xs">
              <RefreshCw className="h-3 w-3" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(FREQ_LABEL) as FrequenciaAtualizacao[]).map((f) => (
                <SelectItem key={f} value={f}>
                  {FREQ_LABEL[f]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Adicionar chamados
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setArquivarOpen(true)}
          >
            <Archive className="h-3.5 w-3.5" /> Arquivar projeto
          </Button>
        </div>
      </div>

      <div className="space-y-6 p-6">
        {/* Progresso geral */}
        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <h3 className="text-sm font-semibold">Progresso geral</h3>
            <span className="text-xs text-muted-foreground">
              {concluidos} de {projeto.chamadosVinculados.length} itens entregues — {pct}%
            </span>
          </div>
          <Progress value={pct} className="h-3" />

          {/* Mini timeline de etapas */}
          <div className="mt-4 flex items-center gap-1 overflow-x-auto">
            {etapas.map((e, i) => {
              const passado = i < idxEtapa;
              const atual = i === idxEtapa;
              return (
                <div key={e} className="flex flex-1 items-center gap-1">
                  <button
                    onClick={() => moverEtapaProjeto(projeto.id, e, autorId)}
                    className={cn(
                      "flex flex-col items-center text-center text-[10px] gap-1 px-1 py-1 rounded transition-colors",
                      atual && "text-primary font-semibold",
                      passado && "text-success",
                      !atual && !passado && "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "h-3 w-3 rounded-full border-2",
                        atual && "border-primary bg-primary",
                        passado && "border-success bg-success",
                        !atual && !passado && "border-border bg-card",
                      )}
                    />
                    <span className="leading-tight">{e}</span>
                  </button>
                  {i < etapas.length - 1 ? (
                    <div className={cn("h-0.5 flex-1", passado ? "bg-success" : "bg-border")} />
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        {/* Itens do projeto */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              Itens do projeto ({itensProjeto.length})
            </h3>
            <Button size="sm" variant="ghost" onClick={() => setAddOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Adicionar
            </Button>
          </div>
          {itensProjeto.length === 0 ? (
            <p className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              Nenhum chamado vinculado.
            </p>
          ) : (
            <div className="overflow-hidden rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="w-6 px-2 py-2"></th>
                    <th className="px-2 py-2 text-left">ID</th>
                    <th className="px-2 py-2 text-left">Título</th>
                    <th className="px-2 py-2 text-left">Técnico</th>
                    <th className="px-2 py-2 text-left">Status</th>
                    <th className="px-2 py-2 text-left">Aging</th>
                    <th className="w-8 px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {itensProjeto.map((c) => {
                    const tec = mockUsuarios.find((u) => u.id === c.tecnicoId);
                    const visual = getStatusVisual(c);
                    return (
                      <tr
                        key={c.id}
                        className="border-t border-border hover:bg-accent/30"
                      >
                        <td className="px-2 py-2">
                          <span
                            className={cn(
                              "inline-block h-2 w-2 rounded-full",
                              STATUS_VISUAL_DOT[visual],
                            )}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <button
                            onClick={() => abrirChamado(c.id)}
                            className="font-mono text-xs font-semibold text-primary hover:underline"
                          >
                            {c.id}
                          </button>
                        </td>
                        <td className="max-w-[260px] truncate px-2 py-2">{c.titulo}</td>
                        <td className="px-2 py-2 text-xs">{tec?.nome ?? "—"}</td>
                        <td className="px-2 py-2 text-xs">{c.statusInterno}</td>
                        <td className="px-2 py-2 text-xs">{calcularAging(c.dataAbertura)}d</td>
                        <td className="px-2 py-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => setRemoverId(c.id)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Próxima atualização */}
        <section>
          <h3 className="mb-2 text-sm font-semibold">Próxima atualização esperada</h3>
          <div
            className={cn(
              "rounded-md border p-3 text-sm",
              atrasoAtt > 0
                ? "border-destructive/40 bg-destructive/5 text-destructive"
                : "border-border bg-muted/30",
            )}
          >
            {!proximaAtualizacao ? (
              <p className="text-muted-foreground">
                Frequência "conforme necessário" — sem cobrança automática.
              </p>
            ) : atrasoAtt > 0 ? (
              <p className="font-medium">
                Atualização atrasada há {atrasoAtt}d (esperada em{" "}
                {format(proximaAtualizacao, "dd/MM/yyyy")}).
              </p>
            ) : (
              <p>
                Próxima atualização esperada em{" "}
                <strong>{format(proximaAtualizacao, "dd/MM/yyyy")}</strong>.
              </p>
            )}
          </div>
          <div className="mt-2 flex gap-2">
            <Input
              placeholder="Nota da atualização (opcional)"
              value={atualizacaoTexto}
              onChange={(e) => setAtualizacaoTexto(e.target.value)}
              className="h-8 text-sm"
            />
            <Button
              size="sm"
              onClick={() => {
                registrarAtualizacaoProjeto(projeto.id, atualizacaoTexto, autorId);
                setAtualizacaoTexto("");
              }}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Registrar agora
            </Button>
          </div>
        </section>

        {/* Linha do tempo */}
        <section>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <History className="h-4 w-4" /> Linha do tempo
          </h3>
          <ol className="space-y-2 border-l border-border pl-4">
            {[...historico].reverse().map((ev) => {
              const u = mockUsuarios.find((x) => x.id === ev.usuarioId);
              return (
                <li key={ev.id} className="relative">
                  <span className="absolute -left-[19px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                  <p className="text-sm text-foreground">{ev.descricao}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {format(ev.data, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    {u ? ` · ${u.nome}` : ""}
                  </p>
                </li>
              );
            })}
            {historico.length === 0 ? (
              <li className="text-xs text-muted-foreground">Sem eventos.</li>
            ) : null}
          </ol>
        </section>

        {/* Observações */}
        <section>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <StickyNote className="h-4 w-4" /> Observações do projeto
          </h3>
          {projeto.observacoes ? (
            <pre className="mb-2 whitespace-pre-wrap rounded-md border border-border bg-muted/20 p-3 text-xs text-foreground">
              {projeto.observacoes}
            </pre>
          ) : null}
          <Textarea
            value={obsTmp}
            onChange={(e) => setObsTmp(e.target.value)}
            placeholder="Adicionar nova observação..."
            className="min-h-[80px]"
          />
          <div className="mt-2 flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                if (!obsTmp.trim()) return;
                adicionarObservacaoProjeto(projeto.id, obsTmp.trim(), autorId);
                setObsTmp("");
              }}
            >
              <Save className="h-3.5 w-3.5" /> Salvar observação
            </Button>
          </div>
        </section>
      </div>

      {/* Confirmação remover */}
      <AlertDialog open={!!removerId} onOpenChange={(o) => !o && setRemoverId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desvincular chamado?</AlertDialogTitle>
            <AlertDialogDescription>
              O chamado <span className="font-mono">{removerId}</span> será removido deste projeto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (removerId) removerChamadoProjeto(removerId, projeto.id, autorId);
                setRemoverId(null);
              }}
            >
              Desvincular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Arquivar */}
      <AlertDialog open={arquivarOpen} onOpenChange={setArquivarOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              O projeto será marcado como arquivado e sairá das visões ativas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                arquivarProjeto(projeto.id, autorId);
                setArquivarOpen(false);
                fechar();
              }}
            >
              Arquivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Adicionar chamados */}
      <AdicionarChamadosDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        projeto={projeto}
        onAdd={(ids) => {
          ids.forEach((id) => vincularProjeto(id, projeto.id, autorId));
        }}
      />
    </div>
  );
}

function AdicionarChamadosDialog({
  open,
  onOpenChange,
  projeto,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projeto: Projeto;
  onAdd: (ids: string[]) => void;
}) {
  const { chamados } = useData();
  const [busca, setBusca] = useState("");
  const [selecionados, setSelecionados] = useState<string[]>([]);

  const disponiveis = useMemo(() => {
    return chamados.filter(
      (c) =>
        c.clienteId === projeto.clienteId &&
        !projeto.chamadosVinculados.includes(c.id) &&
        !c.projetoId &&
        (busca === "" ||
          c.id.includes(busca) ||
          c.titulo.toLowerCase().includes(busca.toLowerCase())),
    );
  }, [chamados, projeto, busca]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setSelecionados([]);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar chamados ao projeto</DialogTitle>
          <DialogDescription>
            Apenas chamados do mesmo cliente, ainda sem projeto.
          </DialogDescription>
        </DialogHeader>
        <Input
          placeholder="Buscar por ID ou título..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <div className="max-h-[320px] overflow-y-auto rounded-md border border-border">
          {disponiveis.length === 0 ? (
            <p className="p-4 text-center text-xs text-muted-foreground">
              Nenhum chamado disponível.
            </p>
          ) : (
            disponiveis.map((c) => {
              const checked = selecionados.includes(c.id);
              return (
                <label
                  key={c.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2 text-sm hover:bg-accent/30",
                    checked && "bg-accent/40",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      setSelecionados((prev) =>
                        e.target.checked ? [...prev, c.id] : prev.filter((x) => x !== c.id),
                      )
                    }
                  />
                  <span className="font-mono text-xs text-primary">{c.id}</span>
                  <span className="truncate">{c.titulo}</span>
                </label>
              );
            })
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={selecionados.length === 0}
            onClick={() => {
              onAdd(selecionados);
              setSelecionados([]);
              onOpenChange(false);
            }}
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar {selecionados.length || ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// suppress unused import warnings
void Trash2;
void ExternalLink;
void Clock;

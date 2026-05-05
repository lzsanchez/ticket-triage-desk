import { useMemo, useState } from "react";
import {
  ArrowLeftRight,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  FileCode2,
  FolderKanban,
  History,
  Link2,
  Moon,
  RefreshCw,
  Save,
  StickyNote,
  UserCircle2,
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@tanstack/react-router";
import { useChamadoModal } from "@/lib/chamadoModal";
import { useData } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { mockClientes } from "@/data/mockClientes";
import { mockUsuarios } from "@/data/mockUsuarios";
import {
  calcularAging,
  calcularDiasSemUpdate,
  cn,
  getStatusVisual,
  glpiTicketUrl,
  fmtDataBR,
  aplicarPlaceholdersScript,
} from "@/lib/utils";
import { VincularProjetoDialog } from "@/components/triagem/VincularProjetoDialog";
import type {
  Chamado,
  Movimentacao,
  StatusInterno,
  StatusVisual,
  TipoMovimentacao,
} from "@/types";

const STATUS_LABEL: Record<StatusInterno, string> = {
  triagem: "Triagem",
  a_fazer_hoje: "A fazer hoje",
  em_tratativa: "Em tratativa",
  aguardando_terceiro: "Aguardando terceiro",
  aguardando_gestor: "Aguardando gestor",
  concluido: "Concluído",
};

const STATUS_DOT: Record<StatusVisual, string> = {
  verde: "bg-success",
  amarelo: "bg-warning",
  vermelho: "bg-destructive",
  cinza: "bg-muted-foreground/60",
};

const PRIORIDADE_BADGE: Record<string, string> = {
  baixa: "bg-muted text-muted-foreground",
  media: "bg-secondary text-secondary-foreground",
  alta: "bg-warning/15 text-warning border border-warning/30",
  critica: "bg-destructive/15 text-destructive border border-destructive/30",
};

const TIPO_MOV_ICON: Record<TipoMovimentacao, typeof History> = {
  atribuicao: UserCircle2,
  mudanca_status: ArrowLeftRight,
  snooze: Moon,
  observacao: StickyNote,
  vinculacao_projeto: FolderKanban,
};

export function ChamadoDetailsModal() {
  const { abertoId, fechar } = useChamadoModal();
  const { chamados } = useData();

  const chamado = useMemo(
    () => (abertoId ? chamados.find((c) => c.id === abertoId) ?? null : null),
    [abertoId, chamados],
  );

  return (
    <Sheet open={!!chamado} onOpenChange={(o) => !o && fechar()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-none md:max-w-[55vw] lg:max-w-[50vw] overflow-y-auto p-0"
      >
        {chamado ? <ModalConteudo chamado={chamado} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function ModalConteudo({ chamado }: { chamado: Chamado }) {
  const { user } = useAuth();
  const {
    setStatus,
    atribuirTecnico,
    setSnooze,
    adicionarObservacao,
    marcarScriptUsado,
    scripts,
  } = useData();
  const isManager = user?.role === "gestor";
  const autorId = user?.id ?? "luciano";

  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [scriptsOpen, setScriptsOpen] = useState(true);
  const [vincularOpen, setVincularOpen] = useState(false);
  const [novaObs, setNovaObs] = useState("");

  const cliente = mockClientes.find((c) => c.id === chamado.clienteId);
  const tecnico = chamado.tecnicoId
    ? mockUsuarios.find((u) => u.id === chamado.tecnicoId)
    : null;
  const visual = getStatusVisual(chamado);
  const aging = calcularAging(chamado.dataAbertura);
  const semUpdate = calcularDiasSemUpdate(chamado.dataUltimaAtualizacao);
  const snoozed = chamado.snoozeAte && chamado.snoozeAte.getTime() > Date.now();

  const scriptsCompativeis = scripts.filter(
    (s) => s.tipoChamadoCategoria === chamado.tipoChamado.categoria,
  );

  const placeholderCtx = {
    cliente: cliente?.nome ?? "",
    id_chamado: chamado.id,
    tecnico: tecnico?.nome ?? "",
    titulo: chamado.titulo,
  };

  const historico = [...chamado.historicoMovimentacoes].sort(
    (a, b) => b.data.getTime() - a.data.getTime(),
  );

  function handleSalvarObs() {
    const texto = novaObs.trim();
    if (!texto) return;
    adicionarObservacao(chamado.id, texto, autorId);
    setNovaObs("");
  }

  function aplicarSnoozePreset(date: Date | null, motivo: string) {
    setSnooze(chamado.id, date, motivo, autorId);
    setSnoozeOpen(false);
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-card px-6 py-4">
        <div className="flex items-start justify-between gap-3 pr-8">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xl font-bold text-primary">{chamado.id}</span>
              <a
                href="#"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-accent"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Abrir no GLPI
              </a>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {chamado.tipoChamado.categoria}
              {chamado.tipoChamado.subcategoria ? ` · ${chamado.tipoChamado.subcategoria}` : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-6 py-5">
        {/* Seção 1 — Informações */}
        <section>
          <h2 className="text-lg font-semibold text-foreground">{chamado.titulo}</h2>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Info label="Cliente">
              <div className="font-medium text-foreground">{cliente?.nome ?? "—"}</div>
              <div className="text-xs text-muted-foreground">{cliente?.entidadeGLPI}</div>
            </Info>
            <Info label="Técnico">
              {tecnico ? (
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                    {tecnico.nome
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-foreground">{tecnico.nome}</div>
                    <div className="text-xs text-muted-foreground capitalize">{tecnico.perfil}</div>
                  </div>
                </div>
              ) : (
                <span className="text-muted-foreground italic">Não atribuído</span>
              )}
            </Info>
            <Info label="Status atual">
              <div className="flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", STATUS_DOT[visual])} />
                <span className="text-sm font-medium text-foreground">
                  {STATUS_LABEL[chamado.statusInterno]}
                </span>
                {snoozed ? (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Moon className="h-3 w-3" /> em snooze
                  </span>
                ) : null}
              </div>
            </Info>
            <Info label="Prioridade">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                  PRIORIDADE_BADGE[chamado.prioridade] ?? "bg-muted",
                )}
              >
                {chamado.prioridade}
              </span>
            </Info>
            <Info label="Aberto em">
              <div className="text-sm text-foreground">{fmtData(chamado.dataAbertura)}</div>
              <div className="text-xs text-muted-foreground">há {aging} dia(s)</div>
            </Info>
            <Info label="Última atualização">
              <div className="text-sm text-foreground">{fmtData(chamado.dataUltimaAtualizacao)}</div>
              <div className="text-xs text-muted-foreground">há {semUpdate} dia(s)</div>
            </Info>
            {chamado.projetoId ? (
              <Info label="Projeto vinculado">
                <Link
                  to="/gestao-entrega"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  <FolderKanban className="h-3.5 w-3.5" />
                  {chamado.projetoId}
                </Link>
              </Info>
            ) : null}
          </dl>
        </section>

        {/* Seção 2 — Ações rápidas */}
        <section className="rounded-md border border-border bg-muted/30 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Ações rápidas
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={chamado.statusInterno}
              onValueChange={(v) => setStatus(chamado.id, v as StatusInterno, autorId)}
            >
              <SelectTrigger className="h-9 w-[200px]">
                <SelectValue placeholder="Mudar status" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_LABEL) as StatusInterno[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isManager ? (
              <Select
                value={chamado.tecnicoId ?? ""}
                onValueChange={(v) => atribuirTecnico(chamado.id, v, autorId)}
              >
                <SelectTrigger className="h-9 w-[180px]">
                  <SelectValue placeholder="Reatribuir" />
                </SelectTrigger>
                <SelectContent>
                  {mockUsuarios.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            <Button variant="outline" size="sm" className="h-9" onClick={() => setSnoozeOpen(true)}>
              <Moon className="h-4 w-4 mr-1.5" />
              {snoozed ? "Editar snooze" : "Snooze"}
            </Button>

            <Button variant="outline" size="sm" className="h-9" onClick={() => setVincularOpen(true)}>
              <Link2 className="h-4 w-4 mr-1.5" />
              Vincular a projeto
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => setScriptsOpen((v) => !v)}
            >
              <FileCode2 className="h-4 w-4 mr-1.5" />
              Aplicar script ({scriptsCompativeis.length})
            </Button>

            {snoozed ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-muted-foreground"
                onClick={() => setSnooze(chamado.id, null, "", autorId)}
              >
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Tirar do snooze
              </Button>
            ) : null}
          </div>
          {snoozed && chamado.snoozeAte ? (
            <p className="mt-2 text-xs text-muted-foreground">
              <Moon className="inline h-3 w-3 mr-1" />
              Em snooze até {fmtData(chamado.snoozeAte)}
              {chamado.snoozeMotivo ? ` — ${chamado.snoozeMotivo}` : ""}
            </p>
          ) : null}
        </section>

        {/* Seção 3 — Observações */}
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Observações internas
          </p>
          {chamado.observacoesInternas ? (
            <pre className="mb-3 whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-3 text-sm text-foreground font-sans">
              {chamado.observacoesInternas}
            </pre>
          ) : null}
          <Textarea
            value={novaObs}
            onChange={(e) => setNovaObs(e.target.value)}
            placeholder="Escreva uma nova observação..."
            rows={3}
          />
          <div className="mt-2 flex justify-end">
            <Button size="sm" onClick={handleSalvarObs} disabled={!novaObs.trim()}>
              <Save className="h-4 w-4 mr-1.5" />
              Salvar observação
            </Button>
          </div>
        </section>

        {/* Seção 4 — Histórico */}
        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Histórico de movimentações ({historico.length})
          </p>
          <ol className="relative ml-3 space-y-3 border-l border-border pl-5">
            {historico.map((m) => (
              <TimelineItem key={m.id} mov={m} />
            ))}
          </ol>
        </section>

        {/* Seção 5 — Scripts */}
        <section className="rounded-md border border-border">
          <button
            onClick={() => setScriptsOpen((v) => !v)}
            className="flex w-full items-center justify-between px-3 py-2 text-sm font-semibold text-foreground"
          >
            <span className="flex items-center gap-2">
              <FileCode2 className="h-4 w-4" />
              Scripts disponíveis ({scriptsCompativeis.length})
            </span>
            {scriptsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {scriptsOpen ? (
            <div className="space-y-3 border-t border-border p-3">
              {scriptsCompativeis.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Nenhum script compatível com este tipo de chamado.
                </p>
              ) : (
                scriptsCompativeis.map((s) => (
                  <ScriptCard
                    key={s.id}
                    nome={s.nome}
                    conteudo={s.conteudo}
                    tags={s.tags}
                    onUsado={() => marcarScriptUsado(chamado.id, s.nome, autorId)}
                  />
                ))
              )}
            </div>
          ) : null}
        </section>
      </div>

      <SnoozeDialog
        open={snoozeOpen}
        onOpenChange={setSnoozeOpen}
        onConfirm={aplicarSnoozePreset}
      />
      <VincularProjetoDialog
        chamado={chamado}
        open={vincularOpen}
        onOpenChange={setVincularOpen}
      />
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}

function TimelineItem({ mov }: { mov: Movimentacao }) {
  const Icon = TIPO_MOV_ICON[mov.tipo] ?? History;
  const usuario = mockUsuarios.find((u) => u.id === mov.usuarioId);
  return (
    <li className="relative">
      <span className="absolute -left-[29px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card">
        <Icon className="h-3 w-3 text-muted-foreground" />
      </span>
      <div className="text-xs text-muted-foreground">
        {fmtData(mov.data)} · <span className="font-medium text-foreground">{usuario?.nome ?? mov.usuarioId}</span>
      </div>
      <div className="text-sm text-foreground">{mov.descricao}</div>
      {mov.motivo ? (
        <div className="mt-0.5 text-xs italic text-muted-foreground">"{mov.motivo}"</div>
      ) : null}
    </li>
  );
}

function ScriptCard({
  nome,
  conteudo,
  tags,
  onUsado,
}: {
  nome: string;
  conteudo: string;
  tags: string[];
  onUsado: () => void;
}) {
  const [copiado, setCopiado] = useState(false);
  const [usado, setUsado] = useState(false);
  function copiar() {
    navigator.clipboard?.writeText(conteudo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  }
  function marcar() {
    onUsado();
    setUsado(true);
  }
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{nome}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                #{t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button size="sm" variant="outline" className="h-8" onClick={copiar}>
            {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="ml-1">{copiado ? "Copiado" : "Copiar"}</span>
          </Button>
          <Button size="sm" variant={usado ? "secondary" : "outline"} className="h-8" onClick={marcar}>
            <Check className="h-3.5 w-3.5 mr-1" />
            {usado ? "Marcado" : "Marcar como usado"}
          </Button>
        </div>
      </div>
      <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-sm bg-muted/50 p-2 text-xs text-foreground font-mono">
        {conteudo}
      </pre>
    </div>
  );
}

function SnoozeDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: (date: Date | null, motivo: string) => void;
}) {
  const [motivo, setMotivo] = useState("");
  const [dataCustom, setDataCustom] = useState("");

  const presets = useMemo(() => {
    const agora = new Date();
    const dois = new Date(agora.getTime() + 2 * 60 * 60 * 1000);
    const quatro = new Date(agora.getTime() + 4 * 60 * 60 * 1000);
    const amanha9 = new Date(agora);
    amanha9.setDate(amanha9.getDate() + 1);
    amanha9.setHours(9, 0, 0, 0);
    const amanha14 = new Date(agora);
    amanha14.setDate(amanha14.getDate() + 1);
    amanha14.setHours(14, 0, 0, 0);
    const segunda = new Date(agora);
    const dia = segunda.getDay(); // 0 = domingo
    const ate = ((8 - dia) % 7) || 7; // próximos 1..7 dias até segunda
    segunda.setDate(segunda.getDate() + ate);
    segunda.setHours(9, 0, 0, 0);
    return [
      { label: "Em 2 horas", date: dois },
      { label: "Em 4 horas", date: quatro },
      { label: "Amanhã 9h", date: amanha9 },
      { label: "Amanhã 14h", date: amanha14 },
      { label: "Segunda 9h", date: segunda },
    ];
  }, [open]);

  function aplicar(date: Date) {
    onConfirm(date, motivo.trim());
    setMotivo("");
    setDataCustom("");
  }

  function aplicarCustom() {
    if (!dataCustom) return;
    aplicar(new Date(dataCustom));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" /> Colocar em snooze
          </DialogTitle>
          <DialogDescription>
            Escolha quando o chamado deve voltar para a fila ativa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Motivo (opcional)</Label>
            <Input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: aguardando retorno do cliente"
            />
          </div>

          <div>
            <Label className="text-xs uppercase text-muted-foreground">Atalhos</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {presets.map((p) => (
                <Button
                  key={p.label}
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => aplicar(p.date)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Data e hora customizada</Label>
            <div className="flex gap-2">
              <Input
                type="datetime-local"
                value={dataCustom}
                onChange={(e) => setDataCustom(e.target.value)}
              />
              <Button onClick={aplicarCustom} disabled={!dataCustom}>
                Aplicar
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function fmtData(d: Date) {
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

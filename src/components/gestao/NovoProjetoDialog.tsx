import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useData } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { mockClientes } from "@/data/mockClientes";
import { cn } from "@/lib/utils";
import {
  ETAPAS_CANCELAMENTO,
  ETAPAS_ENTREGA,
  type FrequenciaAtualizacao,
  type TipoProjeto,
} from "@/types";

const FREQ_LABEL: Record<FrequenciaAtualizacao, string> = {
  diaria: "Diária",
  a_cada_2_dias: "A cada 2 dias",
  semanal: "Semanal",
  quinzenal: "Quinzenal",
  conforme_necessario: "Conforme necessário",
};

export function NovoProjetoDialog({
  open,
  onOpenChange,
  tipoInicial = "entrega_link",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tipoInicial?: TipoProjeto;
}) {
  const { chamados, criarProjeto } = useData();
  const { user } = useAuth();
  const [nome, setNome] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [tipo, setTipo] = useState<TipoProjeto>(tipoInicial);
  const [chamadosSel, setChamadosSel] = useState<string[]>([]);
  const [prazo, setPrazo] = useState<Date | undefined>();
  const [frequencia, setFrequencia] = useState<FrequenciaAtualizacao>("semanal");
  const [observacoes, setObservacoes] = useState("");

  const chamadosDisponiveis = useMemo(
    () =>
      chamados.filter(
        (c) => !c.projetoId && (!clienteId || c.clienteId === clienteId),
      ),
    [chamados, clienteId],
  );

  function reset() {
    setNome("");
    setClienteId("");
    setTipo(tipoInicial);
    setChamadosSel([]);
    setPrazo(undefined);
    setFrequencia("semanal");
    setObservacoes("");
  }

  function handleCriar() {
    if (!nome.trim() || !clienteId) return;
    const etapas = tipo === "entrega_link" ? ETAPAS_ENTREGA : ETAPAS_CANCELAMENTO;
    criarProjeto({
      nome: nome.trim(),
      clienteId,
      tipo,
      etapaAtual: etapas[0],
      prazoPrometido: prazo ?? null,
      observacoes: observacoes.trim(),
      frequenciaAtualizacao: frequencia,
      chamadosIniciais: chamadosSel,
      autorId: user?.id ?? "luciano",
    });
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Projeto</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <Label>Nome do projeto</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Sin Implante - Expansão Q3"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Cliente</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {mockClientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <RadioGroup
              value={tipo}
              onValueChange={(v) => setTipo(v as TipoProjeto)}
              className="flex gap-4 pt-2"
            >
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="entrega_link" /> Entrega de Link
              </label>
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="cancelamento" /> Cancelamento
              </label>
            </RadioGroup>
          </div>

          <div className="space-y-1.5">
            <Label>Data esperada de conclusão</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !prazo && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon />
                  {prazo ? format(prazo, "dd/MM/yyyy") : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={prazo}
                  onSelect={setPrazo}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <Label>Frequência de atualização</Label>
            <Select
              value={frequencia}
              onValueChange={(v) => setFrequencia(v as FrequenciaAtualizacao)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(FREQ_LABEL) as FrequenciaAtualizacao[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {FREQ_LABEL[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label>
              Chamados vinculados{" "}
              <span className="text-xs text-muted-foreground">
                ({chamadosSel.length} selecionado(s))
              </span>
            </Label>
            <ScrollArea className="h-32 rounded-md border border-border p-2">
              {chamadosDisponiveis.length === 0 ? (
                <p className="p-2 text-xs text-muted-foreground">
                  {clienteId
                    ? "Nenhum chamado disponível para este cliente."
                    : "Selecione um cliente para ver chamados disponíveis."}
                </p>
              ) : (
                <ul className="space-y-1">
                  {chamadosDisponiveis.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center gap-2 rounded px-1.5 py-1 hover:bg-muted/60"
                    >
                      <Checkbox
                        id={`ch-${c.id}`}
                        checked={chamadosSel.includes(c.id)}
                        onCheckedChange={(v) =>
                          setChamadosSel((prev) =>
                            v ? [...prev, c.id] : prev.filter((x) => x !== c.id),
                          )
                        }
                      />
                      <label
                        htmlFor={`ch-${c.id}`}
                        className="flex-1 cursor-pointer text-xs"
                      >
                        <span className="font-mono text-primary">{c.id}</span>{" "}
                        — {c.titulo}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label>Observações iniciais</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCriar} disabled={!nome.trim() || !clienteId}>
            Criar Projeto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

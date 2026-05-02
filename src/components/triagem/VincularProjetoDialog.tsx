import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useData } from "@/lib/store";
import type { Chamado, TipoProjeto } from "@/types";

type Props = {
  chamado: Chamado | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function VincularProjetoDialog({ chamado, open, onOpenChange }: Props) {
  const { projetos, vincularProjeto, criarProjeto } = useData();
  const [projetoSelecionado, setProjetoSelecionado] = useState<string>("");
  const [novoNome, setNovoNome] = useState("");
  const [novoTipo, setNovoTipo] = useState<TipoProjeto>("entrega_link");
  const [novaEtapa, setNovaEtapa] = useState("Aguardando viabilidade técnica");

  if (!chamado) return null;

  const projetosDoCliente = projetos.filter((p) => p.clienteId === chamado.clienteId);

  function handleVincular() {
    if (!chamado || !projetoSelecionado) return;
    vincularProjeto(chamado.id, projetoSelecionado);
    onOpenChange(false);
    setProjetoSelecionado("");
  }

  function handleCriar() {
    if (!chamado || !novoNome.trim()) return;
    criarProjeto({
      nome: novoNome.trim(),
      clienteId: chamado.clienteId,
      tipo: novoTipo,
      etapaAtual: novaEtapa,
      prazoPrometido: null,
      observacoes: "",
      chamadoIdInicial: chamado.id,
    });
    onOpenChange(false);
    setNovoNome("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Vincular a projeto</DialogTitle>
          <DialogDescription>
            Chamado <span className="font-mono">{chamado.id}</span> — {chamado.titulo}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="existente">
          <TabsList className="w-full">
            <TabsTrigger value="existente" className="flex-1">Projeto existente</TabsTrigger>
            <TabsTrigger value="novo" className="flex-1">Criar novo</TabsTrigger>
          </TabsList>

          <TabsContent value="existente" className="space-y-3 pt-3">
            <Label>Projeto</Label>
            <Select value={projetoSelecionado} onValueChange={setProjetoSelecionado}>
              <SelectTrigger>
                <SelectValue placeholder={projetosDoCliente.length ? "Selecione um projeto" : "Sem projetos para este cliente"} />
              </SelectTrigger>
              <SelectContent>
                {projetosDoCliente.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleVincular} disabled={!projetoSelecionado}>Vincular</Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="novo" className="space-y-3 pt-3">
            <div className="space-y-1.5">
              <Label>Nome do projeto</Label>
              <Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Ex: Sin Implante - Expansão Q3" />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={novoTipo} onValueChange={(v) => setNovoTipo(v as TipoProjeto)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrega_link">Entrega de Link</SelectItem>
                  <SelectItem value="cancelamento">Cancelamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Etapa inicial</Label>
              <Input value={novaEtapa} onChange={(e) => setNovaEtapa(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleCriar} disabled={!novoNome.trim()}>Criar e vincular</Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

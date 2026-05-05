import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  FileCode2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useData } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Script } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/scripts")({
  component: ScriptsPage,
});

function ScriptsPage() {
  return (
    <AppShell>
      <ScriptsView />
    </AppShell>
  );
}

function ScriptsView() {
  const { scripts, tiposChamado, removerScript, duplicarScript } = useData();
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [novo, setNovo] = useState(false);

  const grupos = useMemo(() => {
    const map = new Map<string, Script[]>();
    for (const s of scripts) {
      const k = s.tipoChamadoCategoria || "Sem categoria";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(s);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [scripts]);

  const categoriasDisponiveis = useMemo(() => {
    const set = new Set<string>(tiposChamado.map((t) => t.categoria));
    scripts.forEach((s) => set.add(s.tipoChamadoCategoria));
    return Array.from(set).sort();
  }, [tiposChamado, scripts]);

  const editando = editandoId ? scripts.find((s) => s.id === editandoId) ?? null : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Scripts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Modelos de resposta agrupados por categoria. Use placeholders como{" "}
            <code className="rounded bg-muted px-1 text-xs">{"{cliente}"}</code>,{" "}
            <code className="rounded bg-muted px-1 text-xs">{"{id_chamado}"}</code> e{" "}
            <code className="rounded bg-muted px-1 text-xs">{"{tecnico}"}</code>.
          </p>
        </div>
        <Button onClick={() => setNovo(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Script
        </Button>
      </div>

      <div className="space-y-3">
        {grupos.map(([cat, lista]) => {
          const aberto = openCats[cat] ?? true;
          return (
            <div key={cat} className="rounded-lg border border-border bg-card">
              <button
                onClick={() => setOpenCats((p) => ({ ...p, [cat]: !aberto }))}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  {aberto ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <FileCode2 className="h-4 w-4 text-primary" />
                  {cat}
                  <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {lista.length}
                  </span>
                </span>
              </button>
              {aberto ? (
                <div className="space-y-2 border-t border-border p-3">
                  {lista.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-start justify-between gap-3 rounded-md border border-border bg-background p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">{s.nome}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {s.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                        <pre className="mt-2 whitespace-pre-wrap font-sans text-xs text-muted-foreground line-clamp-2">
                          {s.conteudo.split("\n").slice(0, 2).join("\n")}
                        </pre>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => setEditandoId(s.id)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => duplicarScript(s.id)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (confirm(`Excluir script "${s.nome}"?`)) removerScript(s.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
        {grupos.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nenhum script cadastrado.
          </p>
        ) : null}
      </div>

      <ScriptDialog
        open={novo || !!editando}
        script={editando}
        categorias={categoriasDisponiveis}
        onClose={() => {
          setNovo(false);
          setEditandoId(null);
        }}
      />
    </div>
  );
}

function ScriptDialog({
  open,
  script,
  categorias,
  onClose,
}: {
  open: boolean;
  script: Script | null;
  categorias: string[];
  onClose: () => void;
}) {
  const { criarScript, atualizarScript } = useData();
  const [nome, setNome] = useState(script?.nome ?? "");
  const [categoria, setCategoria] = useState(script?.tipoChamadoCategoria ?? categorias[0] ?? "");
  const [conteudo, setConteudo] = useState(script?.conteudo ?? "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(script?.tags ?? []);

  // sync when opening
  useMemo(() => {
    if (open) {
      setNome(script?.nome ?? "");
      setCategoria(script?.tipoChamadoCategoria ?? categorias[0] ?? "");
      setConteudo(script?.conteudo ?? "");
      setTags(script?.tags ?? []);
      setTagInput("");
    }
  }, [open, script, categorias]);

  function addTag() {
    const t = tagInput.trim().replace(/^#/, "");
    if (!t || tags.includes(t)) return;
    setTags([...tags, t]);
    setTagInput("");
  }

  function salvar() {
    if (!nome.trim() || !conteudo.trim() || !categoria) return;
    if (script) {
      atualizarScript(script.id, { nome, tipoChamadoCategoria: categoria, conteudo, tags });
    } else {
      criarScript({ nome, tipoChamadoCategoria: categoria, conteudo, tags });
    }
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{script ? "Editar Script" : "Novo Script"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Categoria</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>
              Conteúdo{" "}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                — placeholders: {"{cliente}"}, {"{id_chamado}"}, {"{tecnico}"}, {"{titulo}"}
              </span>
            </Label>
            <Textarea
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              rows={10}
              className="mt-1 font-mono text-xs"
            />
          </div>
          <div>
            <Label>Tags</Label>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              {tags.map((t) => (
                <button
                  key={t}
                  onClick={() => setTags(tags.filter((x) => x !== t))}
                  className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground hover:bg-destructive/15"
                  title="Clique para remover"
                >
                  #{t} ×
                </button>
              ))}
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="adicionar tag e Enter"
                className={cn("h-8 w-44 text-xs")}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={!nome.trim() || !conteudo.trim() || !categoria}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useData } from "@/lib/store";
import { mockUsuarios } from "@/data/mockUsuarios";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Cliente, TipoChamado } from "@/types";

export const Route = createFileRoute("/configuracoes")({
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  return (
    <AppShell>
      <Configuracoes />
    </AppShell>
  );
}

function Configuracoes() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">Ajuste os dados base do sistema.</p>
      </div>
      <Tabs defaultValue="usuarios">
        <TabsList>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="tipos">Tipos de Chamado</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="glpi">Integração GLPI</TabsTrigger>
          <TabsTrigger value="visual">Preferências Visuais</TabsTrigger>
        </TabsList>
        <TabsContent value="usuarios" className="mt-4">
          <TabUsuarios />
        </TabsContent>
        <TabsContent value="tipos" className="mt-4">
          <TabTipos />
        </TabsContent>
        <TabsContent value="clientes" className="mt-4">
          <TabClientes />
        </TabsContent>
        <TabsContent value="glpi" className="mt-4">
          <TabGLPI />
        </TabsContent>
        <TabsContent value="visual" className="mt-4">
          <TabVisual />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Usuários ────────────────────────────────────────────────────────────────

function TabUsuarios() {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Perfil</TableHead>
            <TableHead className="text-right">Permissões</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockUsuarios.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.nome}</TableCell>
              <TableCell className="text-muted-foreground">{u.email}</TableCell>
              <TableCell className="capitalize">{u.perfil}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast("Em breve: gerenciamento de permissões")}
                >
                  Gerenciar permissões
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Tipos de Chamado ───────────────────────────────────────────────────────

function TabTipos() {
  const { user } = useAuth();
  const { tiposChamado, criarTipoChamado, atualizarTipoChamado, removerTipoChamado } = useData();
  const isManager = user?.role === "gestor";
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState<TipoChamado | null>(null);
  const [cat, setCat] = useState("");
  const [sub, setSub] = useState("");

  function abrirNovo() {
    setEditando(null);
    setCat("");
    setSub("");
    setOpen(true);
  }
  function abrirEdit(t: TipoChamado) {
    setEditando(t);
    setCat(t.categoria);
    setSub(t.subcategoria ?? "");
    setOpen(true);
  }
  function salvar() {
    if (!cat.trim()) return;
    const novo: TipoChamado = { categoria: cat.trim(), subcategoria: sub.trim() || undefined };
    if (editando) {
      atualizarTipoChamado(editando.categoria, editando.subcategoria, novo);
    } else {
      criarTipoChamado(novo);
    }
    setOpen(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <p className="text-sm text-muted-foreground">{tiposChamado.length} tipos cadastrados</p>
        {isManager ? (
          <Button onClick={abrirNovo} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Adicionar Tipo
          </Button>
        ) : null}
      </div>
      <div className="rounded-lg border border-border bg-card p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categoria</TableHead>
              <TableHead>Subcategoria</TableHead>
              <TableHead className="w-32 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiposChamado.map((t, i) => (
              <TableRow key={`${t.categoria}-${t.subcategoria ?? ""}-${i}`}>
                <TableCell className="font-medium">{t.categoria}</TableCell>
                <TableCell className="text-muted-foreground">{t.subcategoria ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {isManager ? (
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => abrirEdit(t)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm("Remover este tipo?"))
                            removerTipoChamado(t.categoria, t.subcategoria);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Tipo" : "Novo Tipo de Chamado"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Categoria</Label>
              <Input value={cat} onChange={(e) => setCat(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Subcategoria (opcional)</Label>
              <Input value={sub} onChange={(e) => setSub(e.target.value)} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={salvar}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Clientes ────────────────────────────────────────────────────────────────

function TabClientes() {
  const { user } = useAuth();
  const { clientes, chamados, criarCliente, atualizarCliente, removerCliente } = useData();
  const isManager = user?.role === "gestor";
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [nome, setNome] = useState("");
  const [entidade, setEntidade] = useState("");

  const counts = useMemo(() => {
    const map: Record<string, { total: number; abertos: number }> = {};
    for (const c of chamados) {
      const e = (map[c.clienteId] ??= { total: 0, abertos: 0 });
      e.total++;
      if (c.statusInterno !== "concluido") e.abertos++;
    }
    return map;
  }, [chamados]);

  function abrirNovo() {
    setEditando(null);
    setNome("");
    setEntidade("");
    setOpen(true);
  }
  function abrirEdit(c: Cliente) {
    setEditando(c);
    setNome(c.nome);
    setEntidade(c.entidadeGLPI);
    setOpen(true);
  }
  function salvar() {
    if (!nome.trim() || !entidade.trim()) return;
    if (editando) {
      atualizarCliente(editando.id, { nome, entidadeGLPI: entidade });
    } else {
      criarCliente({ nome, entidadeGLPI: entidade });
    }
    setOpen(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <p className="text-sm text-muted-foreground">{clientes.length} clientes cadastrados</p>
        {isManager ? (
          <Button onClick={abrirNovo} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Adicionar Cliente
          </Button>
        ) : null}
      </div>
      <div className="rounded-lg border border-border bg-card p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Entidade GLPI</TableHead>
              <TableHead className="text-center">Histórico</TableHead>
              <TableHead className="text-center">Abertos</TableHead>
              <TableHead className="w-32 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.map((c) => {
              const ct = counts[c.id] ?? { total: 0, abertos: 0 };
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.entidadeGLPI}</TableCell>
                  <TableCell className="text-center">{ct.total}</TableCell>
                  <TableCell className="text-center">{ct.abertos}</TableCell>
                  <TableCell className="text-right">
                    {isManager ? (
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => abrirEdit(c)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => {
                            if (confirm(`Remover ${c.nome}?`)) removerCliente(c.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Entidade GLPI</Label>
              <Input
                value={entidade}
                onChange={(e) => setEntidade(e.target.value)}
                className="mt-1"
                placeholder="MobDesk > Mobit Soluções > Clientes > ..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={salvar}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── GLPI ────────────────────────────────────────────────────────────────────

function TabGLPI() {
  const [url, setUrl] = useState("https://mobdesk.mobitsolucoes.com");
  const [appToken, setAppToken] = useState("");
  const [userToken, setUserToken] = useState("");
  const [freq, setFreq] = useState("manual");

  return (
    <div className="rounded-lg border border-border bg-card p-6 max-w-2xl space-y-4">
      <div>
        <Label>URL do GLPI</Label>
        <Input value={url} onChange={(e) => setUrl(e.target.value)} className="mt-1" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>App Token</Label>
          <Input
            type="password"
            value={appToken}
            onChange={(e) => setAppToken(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label>User Token</Label>
          <Input
            type="password"
            value={userToken}
            onChange={(e) => setUserToken(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label>Frequência de sincronização</Label>
        <Select value={freq} onValueChange={setFreq}>
          <SelectTrigger className="mt-1 max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="5min">A cada 5 minutos</SelectItem>
            <SelectItem value="15min">A cada 15 minutos</SelectItem>
            <SelectItem value="1h">A cada hora</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p className="text-xs text-muted-foreground">
        Última sincronização: <span className="italic">nunca</span>
      </p>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={() => toast("Em breve: testar conexão GLPI")}>
          Testar Conexão
        </Button>
        <Button onClick={() => toast("Em breve: sincronização manual")}>Sincronizar Agora</Button>
      </div>
    </div>
  );
}

// ─── Visual ──────────────────────────────────────────────────────────────────

function TabVisual() {
  const { theme, setTheme } = useTheme();
  const [idioma, setIdioma] = useState("pt-BR");
  const [formato, setFormato] = useState("dd/mm/yyyy");

  return (
    <div className="rounded-lg border border-border bg-card p-6 max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm">Modo escuro</Label>
          <p className="text-xs text-muted-foreground">Alterna o tema da interface.</p>
        </div>
        <Switch
          checked={theme === "dark"}
          onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
        />
      </div>
      <div>
        <Label>Idioma</Label>
        <Select value={idioma} onValueChange={setIdioma}>
          <SelectTrigger className="mt-1 max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Formato de data</Label>
        <Select value={formato} onValueChange={setFormato}>
          <SelectTrigger className="mt-1 max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dd/mm/yyyy">dd/mm/yyyy</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

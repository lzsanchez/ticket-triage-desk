import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { seedInitialUsers } from "@/lib/users.functions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function LoginScreen() {
  const { signIn } = useAuth();
  const seed = useServerFn(seedInitialUsers);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) toast.error("Falha no login", { description: error });
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      const res = await seed();
      if (res.ok) {
        toast.success("Usuários criados", {
          description: `Senha padrão: ${res.defaultPassword}. Troque após o primeiro login.`,
        });
      } else {
        toast.info(res.message);
      }
    } catch (err) {
      toast.error("Erro ao criar usuários", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="min-h-screen bg-primary text-primary-foreground">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <div className="mb-10">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground text-sm font-bold">
            FL
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Fila de Links</h1>
          <p className="mt-1 text-sm text-primary-foreground/70">
            Plataforma interna de gestão de chamados de telecom.
          </p>
        </div>

        <Card className="bg-white/5 border-white/10 p-6 text-primary-foreground">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-primary-foreground/80">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-primary-foreground placeholder:text-primary-foreground/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-primary-foreground/80">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="bg-white/10 border-white/20 text-primary-foreground placeholder:text-primary-foreground/40"
              />
            </div>
            <Button type="submit" disabled={loading} variant="secondary" className="w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Entrar
            </Button>
          </form>
        </Card>

        <div className="mt-6 rounded-md border border-dashed border-white/20 p-4 text-[11px] text-primary-foreground/60">
          <p className="mb-2 font-medium uppercase tracking-wider">Primeiro acesso</p>
          <p className="mb-3">Crie os 3 usuários padrão (Luciano, Pedro, Priscila) com senha <code className="rounded bg-white/10 px-1">Mobit@2026</code>.</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleSeed}
            disabled={seeding}
            className="border-white/30 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
          >
            {seeding ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
            Criar usuários iniciais
          </Button>
        </div>

        <p className="mt-10 text-[11px] text-primary-foreground/40">
          Autenticação Lovable Cloud · sessão persistida
        </p>
      </div>
    </div>
  );
}

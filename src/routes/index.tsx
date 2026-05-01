import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <AppShell>
      <Home />
    </AppShell>
  );
}

function Home() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">Início</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
        Olá, {user.name.split(" ")[0]}.
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Bem-vindo à Fila de Links. As telas de operação serão construídas nos próximos blocos.
      </p>

      <div className="mt-8 rounded-md border border-border bg-card p-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          Sessão atual
        </div>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
            {user.initials}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{user.name}</span>
            <span className="text-xs text-muted-foreground">
              {user.role === "gestor" ? "Gestor da equipe" : "Analista"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

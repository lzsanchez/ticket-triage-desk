import { useAuth } from "@/lib/auth";
import { MOCK_USERS } from "@/lib/users";
import { Card } from "@/components/ui/card";

export function LoginScreen() {
  const { login } = useAuth();

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

        <div className="space-y-2">
          <p className="mb-3 text-xs uppercase tracking-wider text-primary-foreground/60">
            Selecione um usuário
          </p>
          {MOCK_USERS.map((u) => (
            <Card
              key={u.id}
              onClick={() => login(u.id)}
              className="flex cursor-pointer items-center gap-3 border-transparent bg-white/5 p-3 text-left text-primary-foreground transition-colors hover:border-secondary hover:bg-white/10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                {u.initials}
              </div>
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium">{u.name}</span>
                <span className="text-[11px] text-primary-foreground/60">
                  {u.role === "gestor" ? "Gestor da equipe" : "Analista"}
                </span>
              </div>
              <span className="text-[11px] text-primary-foreground/40">Entrar →</span>
            </Card>
          ))}
        </div>

        <p className="mt-10 text-[11px] text-primary-foreground/40">
          Ambiente de desenvolvimento · autenticação simulada
        </p>
      </div>
    </div>
  );
}

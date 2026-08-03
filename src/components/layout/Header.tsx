import { LogOut, Moon, RefreshCw, Sun } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useData } from "@/lib/store";
import { Button } from "@/components/ui/button";

export function Header() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { syncing, syncGLPI } = useData();
  if (!user) return null;

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background px-6">
      <div className="text-sm text-muted-foreground">
        {user.role === "gestor" ? "Gestor" : "Analista"}
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={syncGLPI}
          disabled={syncing}
          title="Sincronizar com Mobdesk"
          className="text-muted-foreground"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          title={theme === "dark" ? "Mudar para claro" : "Mudar para escuro"}
          className="text-muted-foreground"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
            {user.initials}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-medium text-foreground">{user.name}</span>
            <span className="text-[11px] text-muted-foreground">
              {user.role === "gestor" ? "Gestor da equipe" : "Analista"}
            </span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={logout} className="gap-2 text-muted-foreground">
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </header>
  );
}

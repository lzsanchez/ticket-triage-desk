import { LogOut, Moon, RefreshCw, Sun, Upload } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useData } from "@/lib/store";
import { parseGLPICSV } from "@/lib/csvImport";
import { Button } from "@/components/ui/button";

export function Header() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { syncing, syncGLPI, importarCSV } = useData();
  const fileRef = useRef<HTMLInputElement>(null);
  if (!user) return null;

  function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { chamados, clientes, warnings } = parseGLPICSV(text);
      if (!chamados.length) {
        toast.error("Nenhum chamado encontrado no arquivo.");
      } else {
        importarCSV(chamados, clientes);
        toast.success(`${chamados.length} chamados importados com sucesso.`);
        if (warnings.length) toast.warning(warnings.join(" "));
      }
    };
    reader.readAsText(file, "utf-8");
    e.target.value = "";
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background px-6">
      <div className="text-sm text-muted-foreground">
        {user.role === "gestor" ? "Gestor" : "Analista"}
      </div>

      <div className="flex items-center gap-4">
        <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleCSV} />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileRef.current?.click()}
          title="Importar CSV do GLPI"
          className="text-muted-foreground"
        >
          <Upload className="h-4 w-4" />
        </Button>
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

import { Link, useRouterState } from "@tanstack/react-router";
import {
  Inbox,
  ListTodo,
  Users2,
  FolderKanban,
  Building2,
  LayoutDashboard,
  FileCode2,
  Settings,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: typeof Inbox;
  badge?: number;
  managerOnly?: boolean;
};

const NAV: NavItem[] = [
  { to: "/triagem", label: "Triagem", icon: Inbox, managerOnly: true },
  { to: "/minha-fila", label: "Minha Fila", icon: ListTodo },
  { to: "/filas-equipe", label: "Filas da Equipe", icon: Users2, managerOnly: true },
  { to: "/gestao-entrega", label: "Gestão de Entrega", icon: FolderKanban },
  { to: "/clientes", label: "Clientes", icon: Building2 },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, managerOnly: true },
  { to: "/scripts", label: "Scripts", icon: FileCode2 },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isManager = user?.role === "gestor";

  const items = NAV.filter((i) => !i.managerOnly || isManager);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-secondary-foreground text-xs font-bold">
          FL
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight">Fila de Links</span>
          <span className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">
            Gestão de Chamados
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to as never}
                  className={cn(
                    "group flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4 opacity-90" />
                    <span>{item.label}</span>
                  </span>
                  {item.badge ? (
                    <span className="inline-flex min-w-[22px] items-center justify-center rounded-full bg-secondary px-1.5 py-0.5 text-[11px] font-semibold text-secondary-foreground">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border px-4 py-3 text-[11px] text-sidebar-foreground/50">
        v0.1 · interno
      </div>
    </aside>
  );
}

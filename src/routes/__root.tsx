import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth";
import { DataProvider } from "@/lib/store";
import { ChamadoModalProvider } from "@/lib/chamadoModal";
import { ChamadoDetailsModal } from "@/components/chamado/ChamadoDetailsModal";
import { ProjetoModalProvider } from "@/lib/projetoModal";
import { ProjetoDetailsModal } from "@/components/gestao/ProjetoDetailsModal";
import { ThemeProvider } from "@/lib/theme";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Fila de Links" },
      { name: "description", content: "Link Queue Pro is a web app for telecom ticket management for corporate internet link teams." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Fila de Links" },
      { property: "og:description", content: "Link Queue Pro is a web app for telecom ticket management for corporate internet link teams." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Fila de Links" },
      { name: "twitter:description", content: "Link Queue Pro is a web app for telecom ticket management for corporate internet link teams." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/a37816e2-e2ee-4ef1-8dda-960dd0acbddf/id-preview-920a75e9--2ca4aa33-501a-4f35-87af-3975d1743b20.lovable.app-1777859877799.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/a37816e2-e2ee-4ef1-8dda-960dd0acbddf/id-preview-920a75e9--2ca4aa33-501a-4f35-87af-3975d1743b20.lovable.app-1777859877799.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <ChamadoModalProvider>
            <ProjetoModalProvider>
              <Outlet />
              <ChamadoDetailsModal />
              <ProjetoDetailsModal />
              <Toaster />
            </ProjetoModalProvider>
          </ChamadoModalProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

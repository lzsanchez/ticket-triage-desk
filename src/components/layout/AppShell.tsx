import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useAuth } from "@/lib/auth";
import { LoginScreen } from "@/components/auth/LoginScreen";

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  if (!user) return <LoginScreen />;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-60">
        <Header />
        <main className="px-8 py-8">{children}</main>
      </div>
    </div>
  );
}

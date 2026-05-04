import { createContext, useContext, useState, type ReactNode } from "react";

type Ctx = {
  abertoId: string | null;
  abrir: (id: string) => void;
  fechar: () => void;
};

const C = createContext<Ctx | null>(null);

export function ProjetoModalProvider({ children }: { children: ReactNode }) {
  const [abertoId, setAbertoId] = useState<string | null>(null);
  return (
    <C.Provider value={{ abertoId, abrir: setAbertoId, fechar: () => setAbertoId(null) }}>
      {children}
    </C.Provider>
  );
}

export function useProjetoModal() {
  const ctx = useContext(C);
  if (!ctx) throw new Error("useProjetoModal must be used within ProjetoModalProvider");
  return ctx;
}

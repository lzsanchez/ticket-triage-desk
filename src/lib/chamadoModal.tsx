import { createContext, useContext, useState, type ReactNode } from "react";

type ChamadoModalContextValue = {
  abertoId: string | null;
  abrir: (id: string) => void;
  fechar: () => void;
};

const Ctx = createContext<ChamadoModalContextValue | null>(null);

export function ChamadoModalProvider({ children }: { children: ReactNode }) {
  const [abertoId, setAbertoId] = useState<string | null>(null);
  return (
    <Ctx.Provider
      value={{
        abertoId,
        abrir: (id) => setAbertoId(id),
        fechar: () => setAbertoId(null),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useChamadoModal() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useChamadoModal must be used within ChamadoModalProvider");
  return ctx;
}

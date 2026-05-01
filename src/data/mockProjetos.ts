import type { Projeto } from "@/types";

const HOJE = new Date("2026-05-01T12:00:00Z");
const diasAtras = (d: number) => {
  const dt = new Date(HOJE);
  dt.setDate(dt.getDate() - d);
  return dt;
};
const diasAFrente = (d: number) => {
  const dt = new Date(HOJE);
  dt.setDate(dt.getDate() + d);
  return dt;
};

export const mockProjetos: Projeto[] = [
  {
    id: "proj-sin-implante-expansao",
    nome: "Sin Implante - Expansão Clínicas",
    clienteId: "sin-implante",
    tipo: "entrega_link",
    etapaAtual: "Aguardando viabilidade técnica",
    prazoPrometido: diasAFrente(45),
    chamadosVinculados: Array.from({ length: 10 }).map(
      (_, i) => `202604319${(i + 1).toString().padStart(2, "0")}`,
    ),
    observacoes:
      "Lote de 10 novas clínicas. Acompanhar viabilidade junto à Vivo e Algar. Cliente prioritário.",
    dataCriacao: diasAtras(18),
  },
  {
    id: "proj-rumolog-cancel-q2",
    nome: "Rumolog - Cancelamento Q2",
    clienteId: "rumolog",
    tipo: "cancelamento",
    etapaAtual: "Análise de multa contratual",
    prazoPrometido: diasAFrente(60),
    chamadosVinculados: ["2026043301", "2026043302", "2026043303", "2026043304"],
    observacoes:
      "Cancelamento de 4 links da Rumolog no Q2. Verificar fim de fidelidade de cada contrato.",
    dataCriacao: diasAtras(60),
  },
];

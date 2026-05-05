import type { Projeto } from "@/types";

const HOJE = new Date("2026-05-05T12:00:00Z");
const da = (d: number) => { const dt = new Date(HOJE); dt.setDate(dt.getDate() - d); return dt; };
const df = (d: number) => { const dt = new Date(HOJE); dt.setDate(dt.getDate() + d); return dt; };

// Chamado IDs must match mockChamados.ts
const SIN_IDS  = Array.from({ length: 18 }, (_, i) => `2026050${(i + 1).toString().padStart(3, "0")}`);
const RUM_IDS  = Array.from({ length: 12 }, (_, i) => `2026050${(i + 19).toString().padStart(3, "0")}`);
const IDL_IDS  = Array.from({ length: 8  }, (_, i) => `2026050${(i + 31).toString().padStart(3, "0")}`);
const BRA_IDS  = Array.from({ length: 9  }, (_, i) => `2026050${(i + 39).toString().padStart(3, "0")}`);

export const mockProjetos: Projeto[] = [
  {
    id: "proj-sin-expansao",
    nome: "Sin Implante - Expansão Clínicas 2025",
    clienteId: "sin-implante",
    tipo: "entrega_link",
    etapaAtual: "Instalado",
    prazoPrometido: df(25),
    chamadosVinculados: SIN_IDS,
    observacoes:
      "Lote de 18 novas clínicas. Instalações em andamento — maioria já concluída operacionalmente, aguardando entrega formal. Cliente prioritário.",
    dataCriacao: da(320),
    frequenciaAtualizacao: "semanal",
    ultimaAtualizacaoRegistrada: da(2),
  },
  {
    id: "proj-rumolog-modern",
    nome: "Rumolog - Modernização Links Q1",
    clienteId: "rumolog",
    tipo: "entrega_link",
    etapaAtual: "Aguardando Viabilidade",
    prazoPrometido: df(40),
    chamadosVinculados: RUM_IDS,
    observacoes:
      "Substituição de 12 links legados por solução MPLS. Acompanhar viabilidade técnica com Vivo e Claro. Aprovação comercial pendente.",
    dataCriacao: da(60),
    frequenciaAtualizacao: "a_cada_2_dias",
    ultimaAtualizacaoRegistrada: da(1),
  },
  {
    id: "proj-idlog-cancel",
    nome: "Id Logistics - Cancelamento Filiais Desativadas",
    clienteId: "id-logistics",
    tipo: "cancelamento",
    etapaAtual: "Análise Interna",
    prazoPrometido: df(9),
    chamadosVinculados: IDL_IDS,
    observacoes:
      "Cancelamento de 8 links em filiais fechadas no Q1. Prazo apertado — multas precisam ser validadas antes do aceite. Luciano responsável.",
    dataCriacao: da(30),
    frequenciaAtualizacao: "diaria",
    ultimaAtualizacaoRegistrada: da(0),
  },
  {
    id: "proj-brasanitas-implant",
    nome: "Grupo Brasanitas - Implantação Rede Nova",
    clienteId: "grupo-brasanitas",
    tipo: "entrega_link",
    etapaAtual: "Agendado",
    prazoPrometido: df(19),
    chamadosVinculados: BRA_IDS,
    observacoes:
      "9 unidades do grupo sendo migradas para nova topologia de rede. 5 já instaladas, 4 aguardando agendamento com operadora.",
    dataCriacao: da(45),
    frequenciaAtualizacao: "semanal",
    ultimaAtualizacaoRegistrada: da(3),
  },
];

import type { Chamado, Movimentacao, Prioridade, StatusInterno } from "@/types";

// Reference "today" for deterministic mock dates. Avoids hydration drift.
const HOJE = new Date("2026-05-01T12:00:00Z");

function diasAtras(d: number): Date {
  const dt = new Date(HOJE);
  dt.setDate(dt.getDate() - d);
  return dt;
}

function diasAFrente(d: number): Date {
  const dt = new Date(HOJE);
  dt.setDate(dt.getDate() + d);
  return dt;
}

function mov(
  id: string,
  data: Date,
  usuarioId: string,
  tipo: Movimentacao["tipo"],
  descricao: string,
  motivo?: string,
): Movimentacao {
  return { id, data, usuarioId, tipo, descricao, motivo };
}

type Spec = {
  id: string;
  titulo: string;
  clienteId: string;
  categoria: string;
  subcategoria?: string;
  tecnicoId: string | null;
  abertoDiasAtras: number;
  updateDiasAtras: number;
  status: StatusInterno;
  prioridade: Prioridade;
  snoozeDiasFrente?: number;
  snoozeMotivo?: string;
  projetoId?: string;
  obs?: string;
};

const SPECS: Spec[] = [
  // === 10 instalações Sin Implante (lote/projeto, mesma data, todos do Pedro) ===
  ...Array.from({ length: 10 }).map<Spec>((_, i) => ({
    id: `202604319${(i + 1).toString().padStart(2, "0")}`,
    titulo: `Sin Implante - Nova Clínica ${["Moema", "Tatuapé", "Pinheiros", "Santana", "Vila Mariana", "Campinas", "Sorocaba", "Ribeirão", "Santos", "ABC"][i]}`,
    clienteId: "sin-implante",
    categoria: "Instalação",
    subcategoria: "Nova Instalação sem Linha Fixa",
    tecnicoId: "pedro",
    abertoDiasAtras: 18,
    updateDiasAtras: [1, 2, 4, 5, 7, 9, 12, 14, 6, 3][i],
    status: (
      ["em_tratativa", "em_tratativa", "aguardando_terceiro", "em_tratativa", "aguardando_terceiro", "em_tratativa", "aguardando_terceiro", "aguardando_gestor", "em_tratativa", "a_fazer_hoje"] as StatusInterno[]
    )[i],
    prioridade: (["alta", "alta", "media", "alta", "media", "alta", "media", "alta", "media", "alta"] as Prioridade[])[i],
    projetoId: "proj-sin-implante-expansao",
    obs: "Lote da expansão Sin Implante. Acompanhar viabilidade junto à operadora.",
  })),

  // === Outras 12 instalações sem linha fixa (variadas) ===
  {
    id: "2026043201",
    titulo: "Rumolog - Instalação CD Cajamar",
    clienteId: "rumolog",
    categoria: "Instalação",
    subcategoria: "Nova Instalação sem Linha Fixa",
    tecnicoId: "priscila",
    abertoDiasAtras: 35,
    updateDiasAtras: 2,
    status: "em_tratativa",
    prioridade: "alta",
  },
  {
    id: "2026043202",
    titulo: "Id Logistics - Instalação Filial Guarulhos",
    clienteId: "id-logistics",
    categoria: "Instalação",
    subcategoria: "Nova Instalação sem Linha Fixa",
    tecnicoId: "luciano",
    abertoDiasAtras: 42,
    updateDiasAtras: 9,
    status: "aguardando_terceiro",
    prioridade: "media",
  },
  {
    id: "2026043203",
    titulo: "Grupo Brasanitas - Instalação Sede SP",
    clienteId: "grupo-brasanitas",
    categoria: "Instalação",
    subcategoria: "Nova Instalação sem Linha Fixa",
    tecnicoId: "pedro",
    abertoDiasAtras: 60,
    updateDiasAtras: 15,
    status: "aguardando_terceiro",
    prioridade: "media",
  },
  {
    id: "2026043204",
    titulo: "Garbuio - Instalação Filial Sorocaba",
    clienteId: "garbuio",
    categoria: "Instalação",
    subcategoria: "Nova Instalação sem Linha Fixa",
    tecnicoId: "priscila",
    abertoDiasAtras: 25,
    updateDiasAtras: 1,
    status: "em_tratativa",
    prioridade: "alta",
  },
  {
    id: "2026043205",
    titulo: "Steck - Instalação Filial Curitiba",
    clienteId: "steck",
    categoria: "Instalação",
    subcategoria: "Nova Instalação sem Linha Fixa",
    tecnicoId: "luciano",
    abertoDiasAtras: 90,
    updateDiasAtras: 22,
    status: "aguardando_terceiro",
    prioridade: "media",
  },
  {
    id: "2026043206",
    titulo: "Lopes - Instalação Imobiliária Brooklin",
    clienteId: "lopes",
    categoria: "Instalação",
    subcategoria: "Nova Instalação sem Linha Fixa",
    tecnicoId: "pedro",
    abertoDiasAtras: 12,
    updateDiasAtras: 3,
    status: "em_tratativa",
    prioridade: "media",
  },
  {
    id: "2026043207",
    titulo: "Dentista Mais - Instalação Unidade Tatuapé",
    clienteId: "dentista-mais",
    categoria: "Instalação",
    subcategoria: "Nova Instalação sem Linha Fixa",
    tecnicoId: "priscila",
    abertoDiasAtras: 8,
    updateDiasAtras: 1,
    status: "a_fazer_hoje",
    prioridade: "alta",
  },
  {
    id: "2026043208",
    titulo: "Rumolog - Instalação Filial Extrema",
    clienteId: "rumolog",
    categoria: "Instalação",
    subcategoria: "Nova Instalação sem Linha Fixa",
    tecnicoId: "luciano",
    abertoDiasAtras: 110,
    updateDiasAtras: 35,
    status: "aguardando_terceiro",
    prioridade: "media",
  },
  {
    id: "2026043209",
    titulo: "Id Logistics - Instalação CD Embu",
    clienteId: "id-logistics",
    categoria: "Instalação",
    subcategoria: "Nova Instalação sem Linha Fixa",
    tecnicoId: "pedro",
    abertoDiasAtras: 70,
    updateDiasAtras: 6,
    status: "em_tratativa",
    prioridade: "media",
  },
  {
    id: "2026043210",
    titulo: "Garbuio - Instalação Matriz",
    clienteId: "garbuio",
    categoria: "Instalação",
    subcategoria: "Nova Instalação sem Linha Fixa",
    tecnicoId: "priscila",
    abertoDiasAtras: 45,
    updateDiasAtras: 4,
    status: "em_tratativa",
    prioridade: "media",
  },
  {
    id: "2026043211",
    titulo: "Steck - Instalação Filial Joinville",
    clienteId: "steck",
    categoria: "Instalação",
    subcategoria: "Nova Instalação sem Linha Fixa",
    tecnicoId: "luciano",
    abertoDiasAtras: 200,
    updateDiasAtras: 50,
    status: "aguardando_terceiro",
    prioridade: "alta",
  },
  {
    id: "2026043212",
    titulo: "Brasanitas - Instalação Filial Osasco",
    clienteId: "grupo-brasanitas",
    categoria: "Instalação",
    subcategoria: "Nova Instalação sem Linha Fixa",
    tecnicoId: "pedro",
    abertoDiasAtras: 30,
    updateDiasAtras: 8,
    status: "aguardando_terceiro",
    prioridade: "media",
    snoozeDiasFrente: 5,
    snoozeMotivo: "Aguardando retorno da Vivo sobre viabilidade",
  },

  // === 16 chamados de Consulta de Multa e Cancelamento ===
  // 4 da Rumolog vinculados ao projeto cancelamento
  {
    id: "2026043301",
    titulo: "Rumolog - Cancelamento Link Dedicado Filial Itu",
    clienteId: "rumolog",
    categoria: "Consulta de Multa e Cancelamento",
    subcategoria: "Link Dedicado",
    tecnicoId: "priscila",
    abertoDiasAtras: 50,
    updateDiasAtras: 3,
    status: "em_tratativa",
    prioridade: "media",
    projetoId: "proj-rumolog-cancel-q2",
  },
  {
    id: "2026043302",
    titulo: "Rumolog - Cancelamento Link Dedicado Filial Jundiaí",
    clienteId: "rumolog",
    categoria: "Consulta de Multa e Cancelamento",
    subcategoria: "Link Dedicado",
    tecnicoId: "pedro",
    abertoDiasAtras: 48,
    updateDiasAtras: 2,
    status: "em_tratativa",
    prioridade: "media",
    projetoId: "proj-rumolog-cancel-q2",
  },
  {
    id: "2026043303",
    titulo: "Rumolog - Cancelamento Banda Larga Filial Campinas",
    clienteId: "rumolog",
    categoria: "Consulta de Multa e Cancelamento",
    subcategoria: "Banda Larga",
    tecnicoId: "luciano",
    abertoDiasAtras: 55,
    updateDiasAtras: 12,
    status: "aguardando_terceiro",
    prioridade: "baixa",
    projetoId: "proj-rumolog-cancel-q2",
  },
  {
    id: "2026043304",
    titulo: "Rumolog - Cancelamento Banda Larga Filial Sorocaba",
    clienteId: "rumolog",
    categoria: "Consulta de Multa e Cancelamento",
    subcategoria: "Banda Larga",
    tecnicoId: "priscila",
    abertoDiasAtras: 60,
    updateDiasAtras: 5,
    status: "em_tratativa",
    prioridade: "baixa",
    projetoId: "proj-rumolog-cancel-q2",
  },
  // 12 cancelamentos diversos
  {
    id: "2026043305",
    titulo: "Sin Implante - Cancelamento Clínica Antiga",
    clienteId: "sin-implante",
    categoria: "Consulta de Multa e Cancelamento",
    subcategoria: "Banda Larga",
    tecnicoId: "pedro",
    abertoDiasAtras: 22,
    updateDiasAtras: 4,
    status: "em_tratativa",
    prioridade: "baixa",
  },
  {
    id: "2026043306",
    titulo: "Id Logistics - Cancelamento Link CD Antigo",
    clienteId: "id-logistics",
    categoria: "Consulta de Multa e Cancelamento",
    subcategoria: "Link Dedicado",
    tecnicoId: "luciano",
    abertoDiasAtras: 80,
    updateDiasAtras: 18,
    status: "aguardando_terceiro",
    prioridade: "media",
  },
  {
    id: "2026043307",
    titulo: "Garbuio - Cancelamento Filial Desativada",
    clienteId: "garbuio",
    categoria: "Consulta de Multa e Cancelamento",
    subcategoria: "Link Dedicado",
    tecnicoId: "priscila",
    abertoDiasAtras: 28,
    updateDiasAtras: 1,
    status: "em_tratativa",
    prioridade: "media",
  },
  {
    id: "2026043308",
    titulo: "Steck - Cancelamento Banda Larga Filial",
    clienteId: "steck",
    categoria: "Consulta de Multa e Cancelamento",
    subcategoria: "Banda Larga",
    tecnicoId: "pedro",
    abertoDiasAtras: 14,
    updateDiasAtras: 2,
    status: "em_tratativa",
    prioridade: "baixa",
  },
  {
    id: "2026043309",
    titulo: "Lopes - Cancelamento Imobiliária Antiga",
    clienteId: "lopes",
    categoria: "Consulta de Multa e Cancelamento",
    subcategoria: "Banda Larga",
    tecnicoId: "luciano",
    abertoDiasAtras: 95,
    updateDiasAtras: 25,
    status: "aguardando_terceiro",
    prioridade: "baixa",
    snoozeDiasFrente: 10,
    snoozeMotivo: "Cliente pediu retornar contato em 10 dias",
  },
  {
    id: "2026043310",
    titulo: "Brasanitas - Cancelamento Link Dedicado Sede Antiga",
    clienteId: "grupo-brasanitas",
    categoria: "Consulta de Multa e Cancelamento",
    subcategoria: "Link Dedicado",
    tecnicoId: "priscila",
    abertoDiasAtras: 40,
    updateDiasAtras: 6,
    status: "em_tratativa",
    prioridade: "media",
  },
  {
    id: "2026043311",
    titulo: "Dentista Mais - Cancelamento Unidade Fechada",
    clienteId: "dentista-mais",
    categoria: "Consulta de Multa e Cancelamento",
    subcategoria: "Banda Larga",
    tecnicoId: "pedro",
    abertoDiasAtras: 7,
    updateDiasAtras: 1,
    status: "a_fazer_hoje",
    prioridade: "media",
  },
  {
    id: "2026043312",
    titulo: "Rumolog - Cancelamento Link Antigo Sede",
    clienteId: "rumolog",
    categoria: "Consulta de Multa e Cancelamento",
    subcategoria: "Link Dedicado",
    tecnicoId: "luciano",
    abertoDiasAtras: 150,
    updateDiasAtras: 40,
    status: "aguardando_gestor",
    prioridade: "alta",
  },
  {
    id: "2026043313",
    titulo: "Sin Implante - Cancelamento Banda Larga Backup Antigo",
    clienteId: "sin-implante",
    categoria: "Consulta de Multa e Cancelamento",
    subcategoria: "Banda Larga",
    tecnicoId: "priscila",
    abertoDiasAtras: 33,
    updateDiasAtras: 7,
    status: "aguardando_terceiro",
    prioridade: "baixa",
  },
  {
    id: "2026043314",
    titulo: "Id Logistics - Cancelamento Banda Larga Filial",
    clienteId: "id-logistics",
    categoria: "Consulta de Multa e Cancelamento",
    subcategoria: "Banda Larga",
    tecnicoId: "pedro",
    abertoDiasAtras: 18,
    updateDiasAtras: 3,
    status: "em_tratativa",
    prioridade: "baixa",
  },
  {
    id: "2026043315",
    titulo: "Garbuio - Cancelamento Link Dedicado Antigo",
    clienteId: "garbuio",
    categoria: "Consulta de Multa e Cancelamento",
    subcategoria: "Link Dedicado",
    tecnicoId: "luciano",
    abertoDiasAtras: 220,
    updateDiasAtras: 45,
    status: "aguardando_terceiro",
    prioridade: "media",
  },
  {
    id: "2026043316",
    titulo: "Steck - Cancelamento Link Dedicado Filial Antiga",
    clienteId: "steck",
    categoria: "Consulta de Multa e Cancelamento",
    subcategoria: "Link Dedicado",
    tecnicoId: "priscila",
    abertoDiasAtras: 65,
    updateDiasAtras: 14,
    status: "aguardando_terceiro",
    prioridade: "media",
    snoozeDiasFrente: 3,
    snoozeMotivo: "Aguardar formalização do cliente",
  },

  // === 4 Dúvida | Link de Dados ===
  {
    id: "2026043401",
    titulo: "Rumolog - Dúvida sobre velocidade contratada",
    clienteId: "rumolog",
    categoria: "Dúvida",
    subcategoria: "Link de Dados",
    tecnicoId: "pedro",
    abertoDiasAtras: 4,
    updateDiasAtras: 1,
    status: "em_tratativa",
    prioridade: "baixa",
  },
  {
    id: "2026043402",
    titulo: "Brasanitas - Dúvida sobre IP fixo",
    clienteId: "grupo-brasanitas",
    categoria: "Dúvida",
    subcategoria: "Link de Dados",
    tecnicoId: "priscila",
    abertoDiasAtras: 2,
    updateDiasAtras: 0,
    status: "a_fazer_hoje",
    prioridade: "baixa",
  },
  {
    id: "2026043403",
    titulo: "Lopes - Dúvida sobre upgrade de banda",
    clienteId: "lopes",
    categoria: "Dúvida",
    subcategoria: "Link de Dados",
    tecnicoId: "luciano",
    abertoDiasAtras: 6,
    updateDiasAtras: 2,
    status: "em_tratativa",
    prioridade: "baixa",
  },
  {
    id: "2026043404",
    titulo: "Dentista Mais - Dúvida sobre SLA",
    clienteId: "dentista-mais",
    categoria: "Dúvida",
    subcategoria: "Link de Dados",
    tecnicoId: "pedro",
    abertoDiasAtras: 10,
    updateDiasAtras: 5,
    status: "em_tratativa",
    prioridade: "baixa",
  },

  // === 3 Upgrade Links Mobit ===
  {
    id: "2026043501",
    titulo: "Id Logistics - Upgrade Link CD Principal",
    clienteId: "id-logistics",
    categoria: "Upgrade Links Mobit",
    tecnicoId: "priscila",
    abertoDiasAtras: 20,
    updateDiasAtras: 4,
    status: "em_tratativa",
    prioridade: "alta",
  },
  {
    id: "2026043502",
    titulo: "Garbuio - Upgrade Link Matriz",
    clienteId: "garbuio",
    categoria: "Upgrade Links Mobit",
    tecnicoId: "luciano",
    abertoDiasAtras: 15,
    updateDiasAtras: 6,
    status: "aguardando_terceiro",
    prioridade: "media",
  },
  {
    id: "2026043503",
    titulo: "Steck - Upgrade Link Filial",
    clienteId: "steck",
    categoria: "Upgrade Links Mobit",
    tecnicoId: "pedro",
    abertoDiasAtras: 9,
    updateDiasAtras: 2,
    status: "em_tratativa",
    prioridade: "media",
  },

  // === 2 Estudo de Renovação ===
  {
    id: "2026043601",
    titulo: "Rumolog - Estudo de Renovação Contrato 2026",
    clienteId: "rumolog",
    categoria: "Estudo de Renovação",
    tecnicoId: "luciano",
    abertoDiasAtras: 70,
    updateDiasAtras: 8,
    status: "em_tratativa",
    prioridade: "media",
  },
  {
    id: "2026043602",
    titulo: "Brasanitas - Estudo de Renovação Contrato Sede",
    clienteId: "grupo-brasanitas",
    categoria: "Estudo de Renovação",
    tecnicoId: "priscila",
    abertoDiasAtras: 100,
    updateDiasAtras: 20,
    status: "aguardando_terceiro",
    prioridade: "alta",
  },

  // === 1 Remanejamento de Link ===
  {
    id: "2026043701",
    titulo: "Sin Implante - Remanejamento de Link Clínica Centro",
    clienteId: "sin-implante",
    categoria: "Remanejamento de Link",
    tecnicoId: "pedro",
    abertoDiasAtras: 11,
    updateDiasAtras: 3,
    status: "em_tratativa",
    prioridade: "media",
  },

  // === 1 Reparo Técnico ===
  {
    id: "2026043801",
    titulo: "Id Logistics - Reparo Técnico - Link instável CD",
    clienteId: "id-logistics",
    categoria: "Reparo Técnico",
    tecnicoId: "luciano",
    abertoDiasAtras: 1,
    updateDiasAtras: 0,
    status: "em_tratativa",
    prioridade: "critica",
  },

  // === 1 sem técnico (triagem) ===
  {
    id: "2026043901",
    titulo: "Dentista Mais - Solicitação de novo link em nova unidade",
    clienteId: "dentista-mais",
    categoria: "Instalação",
    subcategoria: "Nova Instalação sem Linha Fixa",
    tecnicoId: null,
    abertoDiasAtras: 0,
    updateDiasAtras: 0,
    status: "triagem",
    prioridade: "media",
  },
];

export const mockChamados: Chamado[] = SPECS.map((s) => {
  const dataAbertura = diasAtras(s.abertoDiasAtras);
  const dataUltimaAtualizacao = diasAtras(s.updateDiasAtras);
  const historico: Movimentacao[] = [];

  if (s.tecnicoId) {
    historico.push(
      mov(`${s.id}-m1`, dataAbertura, "luciano", "atribuicao", `Chamado atribuído a ${s.tecnicoId}.`),
    );
  }
  historico.push(
    mov(
      `${s.id}-m2`,
      dataUltimaAtualizacao,
      s.tecnicoId ?? "luciano",
      "mudanca_status",
      `Status alterado para "${s.status}".`,
    ),
  );
  if (s.snoozeDiasFrente && s.snoozeMotivo) {
    historico.push(
      mov(
        `${s.id}-m3`,
        dataUltimaAtualizacao,
        s.tecnicoId ?? "luciano",
        "snooze",
        `Chamado em snooze por ${s.snoozeDiasFrente} dias.`,
        s.snoozeMotivo,
      ),
    );
  }
  if (s.projetoId) {
    historico.push(
      mov(
        `${s.id}-m4`,
        dataAbertura,
        "luciano",
        "vinculacao_projeto",
        `Vinculado ao projeto ${s.projetoId}.`,
      ),
    );
  }

  return {
    id: s.id,
    titulo: s.titulo,
    clienteId: s.clienteId,
    tipoChamado: { categoria: s.categoria, subcategoria: s.subcategoria },
    tecnicoId: s.tecnicoId,
    dataAbertura,
    dataUltimaAtualizacao,
    statusInterno: s.status,
    prioridade: s.prioridade,
    snoozeAte: s.snoozeDiasFrente ? diasAFrente(s.snoozeDiasFrente) : null,
    snoozeMotivo: s.snoozeMotivo ?? null,
    projetoId: s.projetoId ?? null,
    observacoesInternas: s.obs ?? "",
    historicoMovimentacoes: historico,
  };
});

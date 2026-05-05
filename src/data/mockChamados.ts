import type { Chamado, Movimentacao, Prioridade, StatusInterno } from "@/types";

const HOJE = new Date("2026-05-05T12:00:00Z");

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
function mov(id: string, data: Date, usuarioId: string, tipo: Movimentacao["tipo"], descricao: string, motivo?: string): Movimentacao {
  return { id, data, usuarioId, tipo, descricao, motivo };
}

// Tipo shortcuts (spread into specs)
const INS_SF  = { categoria: "Instalação",                          subcategoria: "Nova Instalação sem Linha Fixa" };
const INS_CF  = { categoria: "Instalação",                          subcategoria: "Nova Instalação com Linha Fixa" };
const CAN_LD_C = { categoria: "Consulta de Multa e Cancelamento",   subcategoria: "Link Dedicado - Cliente" };
const CAN_BL_C = { categoria: "Consulta de Multa e Cancelamento",   subcategoria: "Banda Larga / Linha Fixa - Cliente" };
const CAN_BL_M = { categoria: "Consulta de Multa e Cancelamento",   subcategoria: "Banda Larga / Linha Fixa - Mobit" };
const CAN_LD_M = { categoria: "Consulta de Multa e Cancelamento",   subcategoria: "Link Dedicado - Mobit" };
const DUV     = { categoria: "Dúvida",                              subcategoria: "Link de Dados" };
const UPG     = { categoria: "Upgrade Links Mobit" };
const REN     = { categoria: "Estudo de Renovação",                 subcategoria: "Link de Dados" };
const REM     = { categoria: "Remanejamento de Link",               subcategoria: "Internet" };
const REP_INT = { categoria: "Reparo Técnico",                      subcategoria: "Internet" };
const REP_LD  = { categoria: "Reparo Técnico",                      subcategoria: "Link Dedicado" };
const REP_TEL = { categoria: "Reparo Técnico",                      subcategoria: "Telefone" };
const INVENT  = { categoria: "Atualização de Inventário" };
const NEG     = { categoria: "Negócios",                            subcategoria: "Relatório de Serviços e Endereços" };

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
  verMaisTardeDias?: number;
  verMaisTardeMotivo?: string;
  projetoId?: string;
  obs?: string;
};

// Project ID constants
const SIN = "proj-sin-expansao";
const RUM = "proj-rumolog-modern";
const IDL = "proj-idlog-cancel";
const BRA = "proj-brasanitas-implant";

// Sin Implante clinic locations (18)
const SIN_LOCS = [
  "Moema", "Tatuapé", "Pinheiros", "Santana", "Vila Mariana",
  "Campinas", "Sorocaba", "Ribeirão Preto", "Santos", "ABC",
  "Bauru", "São José dos Campos", "Jundiaí", "Osasco", "Guarulhos",
  "Santo André", "São Bernardo", "Mauá",
];

const SIN_STATUS: StatusInterno[] = [
  "em_tratativa", "em_tratativa", "em_tratativa", "em_tratativa", "em_tratativa",
  "em_tratativa", "em_tratativa", "em_tratativa", "em_tratativa",
  "aguardando_terceiro", "aguardando_terceiro", "aguardando_terceiro", "aguardando_terceiro",
  "a_fazer_hoje", "a_fazer_hoje", "a_fazer_hoje",
  "aguardando_gestor",
  "ver_mais_tarde",
];
const SIN_PRI: Prioridade[] = [
  "alta","alta","alta","alta","alta","alta","alta","alta","alta","alta","alta","alta",
  "media","media","media","media","alta","media",
];
const SIN_UPD = [0,1,0,2,1,0,3,1,2,5,8,3,1,0,0,1,2,1];

const SPECS: Spec[] = [
  // ===== Sin Implante project (18 — Pedro, INS_SF, abe=320) =====
  ...Array.from({ length: 18 }, (_, i): Spec => ({
    id: `2026050${(i + 1).toString().padStart(3, "0")}`,
    titulo: `Sin Implante - Instalação Unidade ${SIN_LOCS[i]}`,
    clienteId: "sin-implante",
    ...INS_SF,
    tecnicoId: "pedro",
    abertoDiasAtras: 320,
    updateDiasAtras: SIN_UPD[i],
    status: SIN_STATUS[i],
    prioridade: SIN_PRI[i],
    projetoId: SIN,
    obs: "Lote de expansão Sin Implante. Acompanhar entrega formal com operadora.",
    ...(i === 17 ? { verMaisTardeDias: 3, verMaisTardeMotivo: "aguardando retorno da operadora" } : {}),
  })),

  // ===== Rumolog project (12 — 6L 4P 2Pr, abe=60) =====
  { id: "2026050019", titulo: "Rumolog - Instalação Link MPLS — Cajamar",          clienteId: "rumolog",         ...INS_SF,  tecnicoId: "luciano",  abertoDiasAtras: 60, updateDiasAtras: 0,  status: "em_tratativa",       prioridade: "alta",  projetoId: RUM },
  { id: "2026050020", titulo: "Rumolog - Instalação Link MPLS — Jundiaí",           clienteId: "rumolog",         ...INS_SF,  tecnicoId: "luciano",  abertoDiasAtras: 60, updateDiasAtras: 1,  status: "em_tratativa",       prioridade: "alta",  projetoId: RUM },
  { id: "2026050021", titulo: "Rumolog - Instalação Link MPLS — Extrema",           clienteId: "rumolog",         ...INS_SF,  tecnicoId: "luciano",  abertoDiasAtras: 60, updateDiasAtras: 3,  status: "aguardando_terceiro", prioridade: "media", projetoId: RUM },
  { id: "2026050022", titulo: "Rumolog - Instalação Link MPLS — Guarulhos",         clienteId: "rumolog",         ...INS_SF,  tecnicoId: "luciano",  abertoDiasAtras: 60, updateDiasAtras: 0,  status: "a_fazer_hoje",       prioridade: "alta",  projetoId: RUM },
  { id: "2026050023", titulo: "Rumolog - Instalação Link MPLS — Campinas",          clienteId: "rumolog",         ...INS_SF,  tecnicoId: "luciano",  abertoDiasAtras: 60, updateDiasAtras: 2,  status: "em_tratativa",       prioridade: "media", projetoId: RUM },
  { id: "2026050024", titulo: "Rumolog - Instalação Link MPLS — Curitiba",          clienteId: "rumolog",         ...INS_SF,  tecnicoId: "luciano",  abertoDiasAtras: 60, updateDiasAtras: 5,  status: "aguardando_terceiro", prioridade: "media", projetoId: RUM, verMaisTardeDias: 2, verMaisTardeMotivo: "aguardando viabilidade Claro" },
  { id: "2026050025", titulo: "Rumolog - Upgrade 50Mbps → 200Mbps — Porto Alegre",  clienteId: "rumolog",         ...UPG,    tecnicoId: "pedro",    abertoDiasAtras: 60, updateDiasAtras: 1,  status: "em_tratativa",       prioridade: "alta",  projetoId: RUM },
  { id: "2026050026", titulo: "Rumolog - Instalação Link MPLS — Recife",            clienteId: "rumolog",         ...INS_SF,  tecnicoId: "pedro",    abertoDiasAtras: 60, updateDiasAtras: 0,  status: "aguardando_terceiro", prioridade: "media", projetoId: RUM },
  { id: "2026050027", titulo: "Rumolog - Upgrade 100Mbps → 500Mbps — Salvador",     clienteId: "rumolog",         ...UPG,    tecnicoId: "pedro",    abertoDiasAtras: 60, updateDiasAtras: 4,  status: "aguardando_gestor",  prioridade: "media", projetoId: RUM },
  { id: "2026050028", titulo: "Rumolog - Upgrade 50Mbps → 100Mbps — Vitória",       clienteId: "rumolog",         ...UPG,    tecnicoId: "pedro",    abertoDiasAtras: 60, updateDiasAtras: 2,  status: "a_fazer_hoje",       prioridade: "baixa", projetoId: RUM },
  { id: "2026050029", titulo: "Rumolog - Dúvida sobre SLA contratual — Manaus",     clienteId: "rumolog",         ...DUV,    tecnicoId: "priscila", abertoDiasAtras: 60, updateDiasAtras: 0,  status: "a_fazer_hoje",       prioridade: "baixa", projetoId: RUM },
  { id: "2026050030", titulo: "Rumolog - Dúvida sobre fatura link MPLS",            clienteId: "rumolog",         ...DUV,    tecnicoId: "priscila", abertoDiasAtras: 60, updateDiasAtras: 1,  status: "em_tratativa",       prioridade: "baixa", projetoId: RUM },

  // ===== Id Logistics project (8 — Luciano, CAN_LD_C, abe=30) =====
  { id: "2026050031", titulo: "Id Logistics - Cancelamento DC Osasco — Link Dedicado",       clienteId: "id-logistics", ...CAN_LD_C, tecnicoId: "luciano", abertoDiasAtras: 30, updateDiasAtras: 0, status: "em_tratativa",       prioridade: "alta",  projetoId: IDL },
  { id: "2026050032", titulo: "Id Logistics - Cancelamento DC Barueri — Link Dedicado",      clienteId: "id-logistics", ...CAN_LD_C, tecnicoId: "luciano", abertoDiasAtras: 30, updateDiasAtras: 1, status: "em_tratativa",       prioridade: "alta",  projetoId: IDL },
  { id: "2026050033", titulo: "Id Logistics - Cancelamento Filial ABC — Link Dedicado",      clienteId: "id-logistics", ...CAN_LD_C, tecnicoId: "luciano", abertoDiasAtras: 30, updateDiasAtras: 0, status: "aguardando_terceiro", prioridade: "alta",  projetoId: IDL },
  { id: "2026050034", titulo: "Id Logistics - Cancelamento Filial Campinas — Link Dedicado", clienteId: "id-logistics", ...CAN_LD_C, tecnicoId: "luciano", abertoDiasAtras: 30, updateDiasAtras: 2, status: "aguardando_gestor",  prioridade: "critica", projetoId: IDL },
  { id: "2026050035", titulo: "Id Logistics - Cancelamento Filial Guarulhos — Link Ded.",    clienteId: "id-logistics", ...CAN_LD_C, tecnicoId: "luciano", abertoDiasAtras: 30, updateDiasAtras: 1, status: "em_tratativa",       prioridade: "alta",  projetoId: IDL },
  { id: "2026050036", titulo: "Id Logistics - Cancelamento CD Cajamar — Link Dedicado",      clienteId: "id-logistics", ...CAN_LD_C, tecnicoId: "luciano", abertoDiasAtras: 30, updateDiasAtras: 3, status: "aguardando_terceiro", prioridade: "media", projetoId: IDL },
  { id: "2026050037", titulo: "Id Logistics - Cancelamento Filial Santos — Link Dedicado",   clienteId: "id-logistics", ...CAN_LD_C, tecnicoId: "luciano", abertoDiasAtras: 30, updateDiasAtras: 0, status: "a_fazer_hoje",       prioridade: "alta",  projetoId: IDL },
  { id: "2026050038", titulo: "Id Logistics - Cancelamento CD Ribeirão — Link Dedicado",     clienteId: "id-logistics", ...CAN_LD_C, tecnicoId: "luciano", abertoDiasAtras: 30, updateDiasAtras: 1, status: "em_tratativa",       prioridade: "media", projetoId: IDL },

  // ===== Brasanitas project (9 — 5L 2P 2Pr) =====
  { id: "2026050039", titulo: "Grupo Brasanitas - Instalação Rede — Unidade Lapa",       clienteId: "grupo-brasanitas", ...INS_SF, tecnicoId: "luciano",  abertoDiasAtras: 45, updateDiasAtras: 0,  status: "em_tratativa",       prioridade: "alta",  projetoId: BRA },
  { id: "2026050040", titulo: "Grupo Brasanitas - Instalação Rede — Unidade Tatuapé",    clienteId: "grupo-brasanitas", ...INS_SF, tecnicoId: "luciano",  abertoDiasAtras: 45, updateDiasAtras: 1,  status: "em_tratativa",       prioridade: "alta",  projetoId: BRA },
  { id: "2026050041", titulo: "Grupo Brasanitas - Instalação Rede — Unidade Guarulhos",  clienteId: "grupo-brasanitas", ...INS_SF, tecnicoId: "luciano",  abertoDiasAtras: 45, updateDiasAtras: 3,  status: "aguardando_terceiro", prioridade: "media", projetoId: BRA },
  { id: "2026050042", titulo: "Grupo Brasanitas - Instalação Rede — Unidade Osasco",     clienteId: "grupo-brasanitas", ...INS_SF, tecnicoId: "luciano",  abertoDiasAtras: 45, updateDiasAtras: 0,  status: "a_fazer_hoje",       prioridade: "media", projetoId: BRA },
  { id: "2026050043", titulo: "Grupo Brasanitas - Instalação Rede — Unidade Santo André", clienteId: "grupo-brasanitas", ...INS_SF, tecnicoId: "luciano",  abertoDiasAtras: 45, updateDiasAtras: 2,  status: "aguardando_terceiro", prioridade: "media", projetoId: BRA },
  { id: "2026050044", titulo: "Grupo Brasanitas - Instalação Rede — Unidade Campinas",   clienteId: "grupo-brasanitas", ...INS_CF, tecnicoId: "pedro",    abertoDiasAtras: 45, updateDiasAtras: 1,  status: "em_tratativa",       prioridade: "alta",  projetoId: BRA },
  { id: "2026050045", titulo: "Grupo Brasanitas - Instalação Rede — Unidade Jundiaí",    clienteId: "grupo-brasanitas", ...INS_SF, tecnicoId: "pedro",    abertoDiasAtras: 45, updateDiasAtras: 0,  status: "a_fazer_hoje",       prioridade: "media", projetoId: BRA },
  { id: "2026050046", titulo: "Grupo Brasanitas - Instalação Rede — Unidade Sorocaba",   clienteId: "grupo-brasanitas", ...INS_SF, tecnicoId: "priscila", abertoDiasAtras: 45, updateDiasAtras: 5,  status: "aguardando_gestor",  prioridade: "media", projetoId: BRA },
  { id: "2026050047", titulo: "Grupo Brasanitas - Instalação Rede — Unidade São Bernardo", clienteId: "grupo-brasanitas", ...INS_SF, tecnicoId: "priscila", abertoDiasAtras: 45, updateDiasAtras: 2, status: "em_tratativa",       prioridade: "baixa", projetoId: BRA },

  // ===== Sin Implante extra (1 — Luciano) =====
  { id: "2026050048", titulo: "Sin Implante - Dúvida sobre velocidade contratada",  clienteId: "sin-implante",    ...DUV,    tecnicoId: "luciano",  abertoDiasAtras: 15,  updateDiasAtras: 2,  status: "em_tratativa",       prioridade: "baixa" },

  // ===== Rumolog extra (19 — 14L 4P 1Pr) =====
  { id: "2026050049", titulo: "Rumolog - Instalação novo link — Filial Manaus",          clienteId: "rumolog", ...INS_SF,   tecnicoId: "luciano",  abertoDiasAtras: 22, updateDiasAtras: 0,  status: "em_tratativa",        prioridade: "alta" },
  { id: "2026050050", titulo: "Rumolog - Instalação novo link — Filial Fortaleza",       clienteId: "rumolog", ...INS_SF,   tecnicoId: "luciano",  abertoDiasAtras: 18, updateDiasAtras: 1,  status: "em_tratativa",        prioridade: "alta" },
  { id: "2026050051", titulo: "Rumolog - Instalação novo link — Filial Belém",           clienteId: "rumolog", ...INS_SF,   tecnicoId: "luciano",  abertoDiasAtras: 35, updateDiasAtras: 7,  status: "aguardando_terceiro", prioridade: "media" },
  { id: "2026050052", titulo: "Rumolog - Cancelamento link — Contrato Goiânia",          clienteId: "rumolog", ...CAN_LD_C, tecnicoId: "luciano",  abertoDiasAtras: 40, updateDiasAtras: 2,  status: "aguardando_terceiro", prioridade: "media" },
  { id: "2026050053", titulo: "Rumolog - Cancelamento link — Contrato Belo Horizonte",   clienteId: "rumolog", ...CAN_LD_C, tecnicoId: "luciano",  abertoDiasAtras: 50, updateDiasAtras: 5,  status: "aguardando_terceiro", prioridade: "media" },
  { id: "2026050054", titulo: "Rumolog - Cancelamento BL — Escritório Florianópolis",    clienteId: "rumolog", ...CAN_BL_C, tecnicoId: "luciano",  abertoDiasAtras: 28, updateDiasAtras: 3,  status: "em_tratativa",        prioridade: "baixa" },
  { id: "2026050055", titulo: "Rumolog - Dúvida — Renovação contrato link legado SP",    clienteId: "rumolog", ...DUV,      tecnicoId: "luciano",  abertoDiasAtras: 10, updateDiasAtras: 0,  status: "a_fazer_hoje",        prioridade: "baixa" },
  { id: "2026050056", titulo: "Rumolog - Upgrade 200Mbps → 500Mbps — Matriz SP",         clienteId: "rumolog", ...UPG,      tecnicoId: "luciano",  abertoDiasAtras: 14, updateDiasAtras: 1,  status: "em_tratativa",        prioridade: "alta" },
  { id: "2026050057", titulo: "Rumolog - Upgrade 100Mbps → 200Mbps — Filial Brasília",   clienteId: "rumolog", ...UPG,      tecnicoId: "luciano",  abertoDiasAtras: 20, updateDiasAtras: 2,  status: "aguardando_gestor",   prioridade: "media" },
  { id: "2026050058", titulo: "Rumolog - Estudo de renovação — Link Dedicado Matriz",     clienteId: "rumolog", ...REN,      tecnicoId: "luciano",  abertoDiasAtras: 55, updateDiasAtras: 10, status: "aguardando_terceiro", prioridade: "baixa" },
  { id: "2026050059", titulo: "Rumolog - Cancelamento link — Escritório Natal",           clienteId: "rumolog", ...CAN_LD_M, tecnicoId: "luciano",  abertoDiasAtras: 45, updateDiasAtras: 8,  status: "em_tratativa",        prioridade: "baixa" },
  { id: "2026050060", titulo: "Rumolog - Instalação novo link — Filial Teresina",         clienteId: "rumolog", ...INS_SF,   tecnicoId: "luciano",  abertoDiasAtras: 12, updateDiasAtras: 1,  status: "em_tratativa",        prioridade: "media" },
  { id: "2026050061", titulo: "Rumolog - Cancelamento BL — Unidade Mogi das Cruzes",     clienteId: "rumolog", ...CAN_BL_C, tecnicoId: "luciano",  abertoDiasAtras: 32, updateDiasAtras: 3,  status: "em_tratativa",        prioridade: "baixa" },
  { id: "2026050062", titulo: "Rumolog - Instalação link fibra — Filial Joinville",       clienteId: "rumolog", ...INS_SF,   tecnicoId: "luciano",  abertoDiasAtras: 8,  updateDiasAtras: 0,  status: "a_fazer_hoje",        prioridade: "media" },
  { id: "2026050063", titulo: "Rumolog - Instalação link fibra — Filial Londrina",        clienteId: "rumolog", ...INS_SF,   tecnicoId: "pedro",    abertoDiasAtras: 5,  updateDiasAtras: 0,  status: "a_fazer_hoje",        prioridade: "media" },
  { id: "2026050064", titulo: "Rumolog - Cancelamento link — Filial Ribeirão Preto",      clienteId: "rumolog", ...CAN_LD_C, tecnicoId: "pedro",    abertoDiasAtras: 60, updateDiasAtras: 15, status: "ver_mais_tarde",      prioridade: "baixa", verMaisTardeDias: 5, verMaisTardeMotivo: "aguardando decisão do cliente" },
  { id: "2026050065", titulo: "Rumolog - Cancelamento link — Filial Maceió",              clienteId: "rumolog", ...CAN_LD_C, tecnicoId: "pedro",    abertoDiasAtras: 48, updateDiasAtras: 12, status: "aguardando_terceiro", prioridade: "baixa" },
  { id: "2026050066", titulo: "Rumolog - Dúvida sobre upgrade fibra — Filial Natal",      clienteId: "rumolog", ...DUV,      tecnicoId: "pedro",    abertoDiasAtras: 6,  updateDiasAtras: 1,  status: "em_tratativa",        prioridade: "baixa" },
  { id: "2026050067", titulo: "Rumolog - Dúvida sobre custo MPLS — Diretor Financeiro",   clienteId: "rumolog", ...DUV,      tecnicoId: "priscila", abertoDiasAtras: 3,  updateDiasAtras: 0,  status: "em_tratativa",        prioridade: "baixa" },

  // ===== Id Logistics extra (10 — 7L 3P) =====
  { id: "2026050068", titulo: "Id Logistics - Instalação link — CD Manaus",              clienteId: "id-logistics", ...INS_SF,   tecnicoId: "luciano", abertoDiasAtras: 20, updateDiasAtras: 0,  status: "em_tratativa",        prioridade: "alta" },
  { id: "2026050069", titulo: "Id Logistics - Instalação link — CD Porto Alegre",        clienteId: "id-logistics", ...INS_SF,   tecnicoId: "luciano", abertoDiasAtras: 15, updateDiasAtras: 1,  status: "em_tratativa",        prioridade: "alta" },
  { id: "2026050070", titulo: "Id Logistics - Cancelamento — Filial Sorocaba BL",        clienteId: "id-logistics", ...CAN_BL_C, tecnicoId: "luciano", abertoDiasAtras: 25, updateDiasAtras: 3,  status: "aguardando_terceiro", prioridade: "media" },
  { id: "2026050071", titulo: "Id Logistics - Instalação link — Filial Curitiba",        clienteId: "id-logistics", ...INS_SF,   tecnicoId: "luciano", abertoDiasAtras: 10, updateDiasAtras: 0,  status: "a_fazer_hoje",        prioridade: "media" },
  { id: "2026050072", titulo: "Id Logistics - Reparo técnico link instável — CD Norte",  clienteId: "id-logistics", ...REP_INT,  tecnicoId: "luciano", abertoDiasAtras: 1,  updateDiasAtras: 0,  status: "em_tratativa",        prioridade: "critica" },
  { id: "2026050073", titulo: "Id Logistics - Instalação nova — CD Belo Horizonte",      clienteId: "id-logistics", ...INS_SF,   tecnicoId: "luciano", abertoDiasAtras: 8,  updateDiasAtras: 1,  status: "em_tratativa",        prioridade: "alta" },
  { id: "2026050074", titulo: "Id Logistics - Dúvida sobre SLA — CD Recife",            clienteId: "id-logistics", ...DUV,      tecnicoId: "luciano", abertoDiasAtras: 5,  updateDiasAtras: 2,  status: "em_tratativa",        prioridade: "baixa" },
  { id: "2026050075", titulo: "Id Logistics - Instalação link — Filial Salvador",        clienteId: "id-logistics", ...INS_SF,   tecnicoId: "pedro",   abertoDiasAtras: 12, updateDiasAtras: 0,  status: "a_fazer_hoje",        prioridade: "alta" },
  { id: "2026050076", titulo: "Id Logistics - Instalação nova com LF — CD Fortaleza",    clienteId: "id-logistics", ...INS_CF,   tecnicoId: "pedro",   abertoDiasAtras: 18, updateDiasAtras: 2,  status: "aguardando_terceiro", prioridade: "media" },
  { id: "2026050077", titulo: "Id Logistics - Cancelamento link dedicado — Filial RJ",   clienteId: "id-logistics", ...CAN_LD_C, tecnicoId: "pedro",   abertoDiasAtras: 22, updateDiasAtras: 4,  status: "aguardando_terceiro", prioridade: "media" },

  // ===== Brasanitas extra (5 — 3L 2P) =====
  { id: "2026050078", titulo: "Grupo Brasanitas - Instalação link — Unidade Recife",     clienteId: "grupo-brasanitas", ...INS_SF,   tecnicoId: "luciano", abertoDiasAtras: 10, updateDiasAtras: 0, status: "a_fazer_hoje",        prioridade: "media" },
  { id: "2026050079", titulo: "Grupo Brasanitas - Cancelamento — Filial Cuiabá",         clienteId: "grupo-brasanitas", ...CAN_LD_C, tecnicoId: "luciano", abertoDiasAtras: 30, updateDiasAtras: 5, status: "aguardando_terceiro", prioridade: "baixa" },
  { id: "2026050080", titulo: "Grupo Brasanitas - Estudo de renovação — Sede SP",        clienteId: "grupo-brasanitas", ...REN,      tecnicoId: "luciano", abertoDiasAtras: 50, updateDiasAtras: 12, status: "ver_mais_tarde",     prioridade: "baixa", verMaisTardeDias: 7, verMaisTardeMotivo: "aguardando proposta comercial" },
  { id: "2026050081", titulo: "Grupo Brasanitas - Instalação nova — Filial Fortaleza",   clienteId: "grupo-brasanitas", ...INS_SF,   tecnicoId: "pedro",   abertoDiasAtras: 6,  updateDiasAtras: 1, status: "em_tratativa",        prioridade: "alta" },
  { id: "2026050082", titulo: "Grupo Brasanitas - Cancelamento BL — Escritório Salvador", clienteId: "grupo-brasanitas", ...CAN_BL_C, tecnicoId: "pedro",   abertoDiasAtras: 20, updateDiasAtras: 3, status: "aguardando_terceiro", prioridade: "baixa" },

  // ===== Garbuio (8 — 4L 2P 2Pr) =====
  { id: "2026050083", titulo: "Garbuio - Instalação novo link — Filial Sorocaba",       clienteId: "garbuio", ...INS_SF,   tecnicoId: "luciano",  abertoDiasAtras: 25, updateDiasAtras: 0,  status: "em_tratativa",        prioridade: "alta" },
  { id: "2026050084", titulo: "Garbuio - Instalação novo link — Filial Campinas",       clienteId: "garbuio", ...INS_SF,   tecnicoId: "luciano",  abertoDiasAtras: 18, updateDiasAtras: 2,  status: "aguardando_terceiro", prioridade: "media" },
  { id: "2026050085", titulo: "Garbuio - Cancelamento link — Contrato Sorocaba ant.",   clienteId: "garbuio", ...CAN_LD_C, tecnicoId: "luciano",  abertoDiasAtras: 40, updateDiasAtras: 7,  status: "aguardando_terceiro", prioridade: "media" },
  { id: "2026050086", titulo: "Garbuio - Upgrade 100Mbps → 300Mbps — Matriz",           clienteId: "garbuio", ...UPG,      tecnicoId: "luciano",  abertoDiasAtras: 12, updateDiasAtras: 1,  status: "em_tratativa",        prioridade: "alta" },
  { id: "2026050087", titulo: "Garbuio - Cancelamento BL — Filial Jundiaí",             clienteId: "garbuio", ...CAN_BL_C, tecnicoId: "pedro",    abertoDiasAtras: 22, updateDiasAtras: 3,  status: "em_tratativa",        prioridade: "baixa" },
  { id: "2026050088", titulo: "Garbuio - Cancelamento link — Filial Bauru",             clienteId: "garbuio", ...CAN_LD_C, tecnicoId: "pedro",    abertoDiasAtras: 35, updateDiasAtras: 9,  status: "ver_mais_tarde",      prioridade: "baixa", verMaisTardeDias: 4, verMaisTardeMotivo: "aguardando aprovação do cliente" },
  { id: "2026050089", titulo: "Garbuio - Dúvida sobre fatura — Link dedicado Matriz",   clienteId: "garbuio", ...DUV,      tecnicoId: "priscila", abertoDiasAtras: 5,  updateDiasAtras: 0,  status: "a_fazer_hoje",        prioridade: "baixa" },
  { id: "2026050090", titulo: "Garbuio - Estudo de renovação — Contrato vencendo",      clienteId: "garbuio", ...REN,      tecnicoId: "priscila", abertoDiasAtras: 60, updateDiasAtras: 20, status: "ver_mais_tarde",      prioridade: "media", verMaisTardeDias: 10, verMaisTardeMotivo: "aguardando posição do gestor de conta" },

  // ===== Steck (7 — 4L 2P 1Pr) =====
  { id: "2026050091", titulo: "Steck - Instalação novo link — Filial Curitiba",         clienteId: "steck", ...INS_SF,   tecnicoId: "luciano",  abertoDiasAtras: 20, updateDiasAtras: 0,  status: "em_tratativa",        prioridade: "alta" },
  { id: "2026050092", titulo: "Steck - Instalação novo link — Filial Joinville",        clienteId: "steck", ...INS_SF,   tecnicoId: "luciano",  abertoDiasAtras: 30, updateDiasAtras: 3,  status: "aguardando_terceiro", prioridade: "media" },
  { id: "2026050093", titulo: "Steck - Cancelamento link — Contrato Blumenau",          clienteId: "steck", ...CAN_LD_C, tecnicoId: "luciano",  abertoDiasAtras: 45, updateDiasAtras: 10, status: "ver_mais_tarde",      prioridade: "baixa", verMaisTardeDias: 6, verMaisTardeMotivo: "aguardando cálculo de multa" },
  { id: "2026050094", titulo: "Steck - Estudo de renovação — Link SP Matriz",           clienteId: "steck", ...REN,      tecnicoId: "luciano",  abertoDiasAtras: 55, updateDiasAtras: 15, status: "aguardando_gestor",   prioridade: "media" },
  { id: "2026050095", titulo: "Steck - Remanejamento link — Filial Florianópolis",      clienteId: "steck", ...REM,      tecnicoId: "pedro",    abertoDiasAtras: 8,  updateDiasAtras: 1,  status: "em_tratativa",        prioridade: "media" },
  { id: "2026050096", titulo: "Steck - Cancelamento link — Filial Londrina",            clienteId: "steck", ...CAN_LD_C, tecnicoId: "pedro",    abertoDiasAtras: 38, updateDiasAtras: 6,  status: "aguardando_terceiro", prioridade: "baixa" },
  { id: "2026050097", titulo: "Steck - Dúvida sobre bandwidth disponível — Curitiba",   clienteId: "steck", ...DUV,      tecnicoId: "priscila", abertoDiasAtras: 3,  updateDiasAtras: 0,  status: "a_fazer_hoje",        prioridade: "baixa" },

  // ===== Lopes (5 — 3L 2P) =====
  { id: "2026050098", titulo: "Lopes - Instalação novo link — Brooklin",                clienteId: "lopes", ...INS_SF,   tecnicoId: "luciano", abertoDiasAtras: 15, updateDiasAtras: 0, status: "em_tratativa",        prioridade: "alta" },
  { id: "2026050099", titulo: "Lopes - Cancelamento link — Filial Campinas",            clienteId: "lopes", ...CAN_LD_C, tecnicoId: "luciano", abertoDiasAtras: 28, updateDiasAtras: 4, status: "aguardando_terceiro", prioridade: "media" },
  { id: "2026050100", titulo: "Lopes - Cancelamento BL Mobit — Escritório Tatuapé",    clienteId: "lopes", ...CAN_BL_M, tecnicoId: "luciano", abertoDiasAtras: 50, updateDiasAtras: 20, status: "em_tratativa",       prioridade: "baixa" },
  { id: "2026050101", titulo: "Lopes - Reparo técnico internet — Sede Brooklin",        clienteId: "lopes", ...REP_INT,  tecnicoId: "pedro",   abertoDiasAtras: 1,  updateDiasAtras: 0, status: "em_tratativa",        prioridade: "critica" },
  { id: "2026050102", titulo: "Lopes - Remanejamento link — Filial Paulista",           clienteId: "lopes", ...REM,      tecnicoId: "pedro",   abertoDiasAtras: 7,  updateDiasAtras: 2, status: "em_tratativa",        prioridade: "media" },

  // ===== Grupo TSDD (4 — 3L 1P) =====
  { id: "2026050103", titulo: "Grupo TSDD - Instalação link — Unidade Centro-Oeste",   clienteId: "grupo-tsdd", ...INS_SF,   tecnicoId: "luciano", abertoDiasAtras: 20, updateDiasAtras: 1, status: "em_tratativa",        prioridade: "alta" },
  { id: "2026050104", titulo: "Grupo TSDD - Cancelamento link dedicado — Filial RJ",   clienteId: "grupo-tsdd", ...CAN_LD_C, tecnicoId: "luciano", abertoDiasAtras: 35, updateDiasAtras: 5, status: "aguardando_terceiro", prioridade: "media" },
  { id: "2026050105", titulo: "Grupo TSDD - Cancelamento BL Mobit — Filial Goiânia",   clienteId: "grupo-tsdd", ...CAN_BL_M, tecnicoId: "luciano", abertoDiasAtras: 42, updateDiasAtras: 12, status: "ver_mais_tarde",    prioridade: "baixa", verMaisTardeDias: 5, verMaisTardeMotivo: "aguardando retorno do cliente" },
  { id: "2026050106", titulo: "Grupo TSDD - Cancelamento link Mobit — Contrato Cuiabá", clienteId: "grupo-tsdd", ...CAN_LD_M, tecnicoId: "pedro",   abertoDiasAtras: 28, updateDiasAtras: 3, status: "em_tratativa",        prioridade: "baixa" },

  // ===== Mobit Soluções (4 — 2L 1P 1Pr) =====
  { id: "2026050107", titulo: "Mobit Soluções - Instalação novo link — Sede Paulista",  clienteId: "mobit-solucoes", ...INS_SF,  tecnicoId: "luciano",  abertoDiasAtras: 10, updateDiasAtras: 0, status: "a_fazer_hoje",        prioridade: "alta" },
  { id: "2026050108", titulo: "Mobit Soluções - Remanejamento link — Filial Sul",       clienteId: "mobit-solucoes", ...REM,     tecnicoId: "luciano",  abertoDiasAtras: 14, updateDiasAtras: 2, status: "em_tratativa",        prioridade: "media" },
  { id: "2026050109", titulo: "Mobit Soluções - Upgrade 200Mbps → 1Gbps — Sede",       clienteId: "mobit-solucoes", ...UPG,     tecnicoId: "pedro",    abertoDiasAtras: 7,  updateDiasAtras: 1, status: "em_tratativa",        prioridade: "alta" },
  { id: "2026050110", titulo: "Mobit Soluções - Dúvida sobre relatório de tráfego",    clienteId: "mobit-solucoes", ...NEG,     tecnicoId: "priscila", abertoDiasAtras: 2,  updateDiasAtras: 0, status: "a_fazer_hoje",        prioridade: "baixa" },

  // ===== Dentista Mais (4 — 2L 2P) =====
  { id: "2026050111", titulo: "Dentista Mais - Instalação novo link — Tatuapé",         clienteId: "dentista-mais", ...INS_SF, tecnicoId: "luciano", abertoDiasAtras: 12, updateDiasAtras: 0, status: "em_tratativa",        prioridade: "alta" },
  { id: "2026050112", titulo: "Dentista Mais - Instalação link com LF — Vila Mariana",  clienteId: "dentista-mais", ...INS_CF, tecnicoId: "luciano", abertoDiasAtras: 18, updateDiasAtras: 2, status: "aguardando_terceiro", prioridade: "media" },
  { id: "2026050113", titulo: "Dentista Mais - Dúvida sobre fidelidade contratual",    clienteId: "dentista-mais", ...DUV,    tecnicoId: "pedro",   abertoDiasAtras: 5,  updateDiasAtras: 0, status: "a_fazer_hoje",        prioridade: "baixa" },
  { id: "2026050114", titulo: "Dentista Mais - Instalação nova unidade — Santana",      clienteId: "dentista-mais", ...INS_SF, tecnicoId: "pedro",   abertoDiasAtras: 3,  updateDiasAtras: 0, status: "triagem",             prioridade: "media" },

  // ===== Vortex (4 — 2L 1P 1Pr) =====
  { id: "2026050115", titulo: "Vortex - Cancelamento link dedicado — Sede SP",          clienteId: "vortex", ...CAN_LD_C, tecnicoId: "luciano",  abertoDiasAtras: 22, updateDiasAtras: 1,  status: "em_tratativa",        prioridade: "media" },
  { id: "2026050116", titulo: "Vortex - Estudo de renovação — Link fibra Campinas",     clienteId: "vortex", ...REN,      tecnicoId: "luciano",  abertoDiasAtras: 45, updateDiasAtras: 15, status: "ver_mais_tarde",      prioridade: "baixa", verMaisTardeDias: 8, verMaisTardeMotivo: "aguardando posição comercial" },
  { id: "2026050117", titulo: "Vortex - Cancelamento BL cliente — Filial Sorocaba",     clienteId: "vortex", ...CAN_BL_C, tecnicoId: "pedro",    abertoDiasAtras: 18, updateDiasAtras: 3,  status: "aguardando_terceiro", prioridade: "baixa" },
  { id: "2026050118", titulo: "Vortex - Cancelamento link Mobit — Contrato RJ",         clienteId: "vortex", ...CAN_LD_M, tecnicoId: "priscila", abertoDiasAtras: 30, updateDiasAtras: 8,  status: "aguardando_terceiro", prioridade: "baixa" },

  // ===== Comporte (4 — 3L 1P) =====
  { id: "2026050119", titulo: "Comporte - Cancelamento link dedicado — Filial SP",      clienteId: "comporte", ...CAN_LD_C, tecnicoId: "luciano", abertoDiasAtras: 35, updateDiasAtras: 2,  status: "em_tratativa",        prioridade: "media" },
  { id: "2026050120", titulo: "Comporte - Cancelamento BL Mobit — Escritório Santos",   clienteId: "comporte", ...CAN_BL_M, tecnicoId: "luciano", abertoDiasAtras: 40, updateDiasAtras: 7,  status: "aguardando_terceiro", prioridade: "baixa" },
  { id: "2026050121", titulo: "Comporte - Cancelamento link Mobit — Contrato Campinas", clienteId: "comporte", ...CAN_LD_M, tecnicoId: "luciano", abertoDiasAtras: 28, updateDiasAtras: 4,  status: "em_tratativa",        prioridade: "baixa" },
  { id: "2026050122", titulo: "Comporte - Cancelamento BL cliente — Filial Jundiaí",    clienteId: "comporte", ...CAN_BL_C, tecnicoId: "pedro",   abertoDiasAtras: 15, updateDiasAtras: 1,  status: "em_tratativa",        prioridade: "baixa" },

  // ===== Progen (4 — 3L 1Pr) =====
  { id: "2026050123", titulo: "Progen - Instalação novo link — Sede SP",                clienteId: "progen", ...INS_SF,   tecnicoId: "luciano",  abertoDiasAtras: 10, updateDiasAtras: 0, status: "em_tratativa",        prioridade: "alta" },
  { id: "2026050124", titulo: "Progen - Instalação link fibra — Filial RJ",             clienteId: "progen", ...INS_SF,   tecnicoId: "luciano",  abertoDiasAtras: 14, updateDiasAtras: 2, status: "aguardando_terceiro", prioridade: "media" },
  { id: "2026050125", titulo: "Progen - Cancelamento link dedicado — Escritório Belo H.", clienteId: "progen", ...CAN_LD_C, tecnicoId: "luciano", abertoDiasAtras: 30, updateDiasAtras: 5, status: "aguardando_terceiro", prioridade: "baixa" },
  { id: "2026050126", titulo: "Progen - Dúvida sobre fatura link fibra — Sede",         clienteId: "progen", ...DUV,      tecnicoId: "priscila", abertoDiasAtras: 2,  updateDiasAtras: 0, status: "a_fazer_hoje",        prioridade: "baixa" },

  // ===== Concremat (4 — 3L 1P) =====
  { id: "2026050127", titulo: "Concremat - Instalação link — Filial Brasília",          clienteId: "concremat", ...INS_SF,   tecnicoId: "luciano", abertoDiasAtras: 18, updateDiasAtras: 1, status: "em_tratativa",        prioridade: "alta" },
  { id: "2026050128", titulo: "Concremat - Cancelamento BL cliente — Escritório RJ",    clienteId: "concremat", ...CAN_BL_C, tecnicoId: "luciano", abertoDiasAtras: 25, updateDiasAtras: 3, status: "aguardando_terceiro", prioridade: "media" },
  { id: "2026050129", titulo: "Concremat - Remanejamento link — Sede SP",               clienteId: "concremat", ...REM,      tecnicoId: "luciano", abertoDiasAtras: 8,  updateDiasAtras: 0, status: "a_fazer_hoje",        prioridade: "media" },
  { id: "2026050130", titulo: "Concremat - Cancelamento link dedicado — Filial Curitiba", clienteId: "concremat", ...CAN_LD_C, tecnicoId: "pedro",  abertoDiasAtras: 38, updateDiasAtras: 8, status: "ver_mais_tarde",      prioridade: "baixa", verMaisTardeDias: 4, verMaisTardeMotivo: "aguardando assinatura de rescisão" },

  // ===== Goodman (3 — 2L 1Pr) =====
  { id: "2026050131", titulo: "Goodman - Upgrade 500Mbps → 1Gbps — Galpão Guarulhos",  clienteId: "goodman", ...UPG,    tecnicoId: "luciano",  abertoDiasAtras: 10, updateDiasAtras: 0, status: "em_tratativa",        prioridade: "alta" },
  { id: "2026050132", titulo: "Goodman - Estudo de renovação — Link dedicado Campinas", clienteId: "goodman", ...REN,    tecnicoId: "luciano",  abertoDiasAtras: 55, updateDiasAtras: 18, status: "aguardando_gestor",  prioridade: "media" },
  { id: "2026050133", titulo: "Goodman - Reparo link dedicado — Galpão SP",             clienteId: "goodman", ...REP_LD, tecnicoId: "priscila", abertoDiasAtras: 2,  updateDiasAtras: 0, status: "em_tratativa",        prioridade: "critica" },

  // ===== Grupo HTB (2 — 1L 1P) =====
  { id: "2026050134", titulo: "Grupo HTB - Cancelamento link dedicado — Filial SP",     clienteId: "grupo-htb", ...CAN_LD_C, tecnicoId: "luciano", abertoDiasAtras: 20, updateDiasAtras: 2, status: "aguardando_terceiro", prioridade: "media" },
  { id: "2026050135", titulo: "Grupo HTB - Cancelamento link dedicado — Filial MG",     clienteId: "grupo-htb", ...CAN_LD_C, tecnicoId: "pedro",   abertoDiasAtras: 15, updateDiasAtras: 1, status: "em_tratativa",        prioridade: "media" },

  // ===== Ascensus (2 — 1L 1Pr) =====
  { id: "2026050136", titulo: "Ascensus - Estudo de renovação — Sede Alphaville",       clienteId: "ascensus", ...REN,    tecnicoId: "luciano",  abertoDiasAtras: 40, updateDiasAtras: 10, status: "aguardando_gestor",  prioridade: "baixa" },
  { id: "2026050137", titulo: "Ascensus - Cancelamento BL Mobit — Escritório Cotia",    clienteId: "ascensus", ...CAN_BL_M, tecnicoId: "priscila", abertoDiasAtras: 22, updateDiasAtras: 4, status: "aguardando_terceiro", prioridade: "baixa" },

  // ===== Tonanni (2 — 2L) =====
  { id: "2026050138", titulo: "Tonanni - Instalação link — Nova Filial Campinas",        clienteId: "tonanni", ...INS_SF,  tecnicoId: "luciano", abertoDiasAtras: 8,  updateDiasAtras: 0, status: "a_fazer_hoje",        prioridade: "alta" },
  { id: "2026050139", titulo: "Tonanni - Cancelamento link Mobit — Filial Sorocaba",     clienteId: "tonanni", ...CAN_LD_M, tecnicoId: "luciano", abertoDiasAtras: 25, updateDiasAtras: 5, status: "em_tratativa",        prioridade: "baixa" },

  // ===== Mais Sorriso (2 — 2L) =====
  { id: "2026050140", titulo: "Mais Sorriso - Instalação link — Clínica Moema",          clienteId: "mais-sorriso", ...INS_SF, tecnicoId: "luciano", abertoDiasAtras: 5,  updateDiasAtras: 0, status: "em_tratativa",        prioridade: "alta" },
  { id: "2026050141", titulo: "Mais Sorriso - Instalação com LF — Clínica Pinheiros",    clienteId: "mais-sorriso", ...INS_CF, tecnicoId: "luciano", abertoDiasAtras: 12, updateDiasAtras: 2, status: "aguardando_terceiro", prioridade: "media" },

  // ===== HTB (2 — 1L 1P) =====
  { id: "2026050142", titulo: "HTB - Cancelamento link Mobit — Contrato SP",            clienteId: "htb", ...CAN_LD_M, tecnicoId: "luciano", abertoDiasAtras: 30, updateDiasAtras: 6,  status: "aguardando_terceiro", prioridade: "baixa" },
  { id: "2026050143", titulo: "HTB - Cancelamento BL Mobit — Escritório RJ",            clienteId: "htb", ...CAN_BL_M, tecnicoId: "pedro",   abertoDiasAtras: 18, updateDiasAtras: 2,  status: "em_tratativa",        prioridade: "baixa" },

  // ===== Singles — EDP, Clínicas BA, CVC (Luciano) =====
  { id: "2026050144", titulo: "EDP - Cancelamento BL cliente — Escritório SP",          clienteId: "edp",          ...CAN_BL_C, tecnicoId: "luciano", abertoDiasAtras: 15, updateDiasAtras: 3, status: "aguardando_terceiro", prioridade: "baixa" },
  { id: "2026050145", titulo: "Clínicas Inteligentes BA - Instalação — Salvador",        clienteId: "clinicas-ba",  ...INS_SF,   tecnicoId: "luciano", abertoDiasAtras: 10, updateDiasAtras: 0, status: "em_tratativa",        prioridade: "alta" },
  { id: "2026050146", titulo: "CVC - Instalação link fibra — Sede Osasco",               clienteId: "cvc",          ...INS_SF,   tecnicoId: "luciano", abertoDiasAtras: 7,  updateDiasAtras: 1, status: "em_tratativa",        prioridade: "media" },

  // ===== Singles — Breton, Zen, Oji, Rheinmetall (triagem) =====
  { id: "2026050147", titulo: "Breton - Solicitação de instalação — Nova Filial",        clienteId: "breton",           ...INS_SF, tecnicoId: null, abertoDiasAtras: 0, updateDiasAtras: 0, status: "triagem", prioridade: "media" },
  { id: "2026050148", titulo: "Zen Contabilidade - Dúvida sobre link contratado",        clienteId: "zen-contabilidade", ...DUV,   tecnicoId: null, abertoDiasAtras: 1, updateDiasAtras: 1, status: "triagem", prioridade: "baixa" },
  { id: "2026050149", titulo: "Oji Papeis - Atualização de inventário de links",         clienteId: "oji-papeis",       ...INVENT, tecnicoId: null, abertoDiasAtras: 0, updateDiasAtras: 0, status: "triagem", prioridade: "baixa" },
  { id: "2026050150", titulo: "Rheinmetall - Reparo técnico — Telefone instável",        clienteId: "rheinmetall",      ...REP_TEL, tecnicoId: null, abertoDiasAtras: 0, updateDiasAtras: 0, status: "triagem", prioridade: "critica" },
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
  if (s.verMaisTardeDias && s.verMaisTardeMotivo) {
    historico.push(
      mov(
        `${s.id}-m3`,
        dataUltimaAtualizacao,
        s.tecnicoId ?? "luciano",
        "ver_mais_tarde",
        `Chamado em "Ver mais tarde" por ${s.verMaisTardeDias} dias.`,
        s.verMaisTardeMotivo,
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
    verMaisTardeAte: s.verMaisTardeDias ? diasAFrente(s.verMaisTardeDias) : null,
    verMaisTardeMotivo: s.verMaisTardeMotivo ?? null,
    projetoId: s.projetoId ?? null,
    observacoesInternas: s.obs ?? "",
    historicoMovimentacoes: historico,
  };
});

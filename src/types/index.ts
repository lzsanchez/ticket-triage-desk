export type PerfilUsuario = "gestor" | "analista";

export type Usuario = {
  id: string;
  nome: string;
  perfil: PerfilUsuario;
  email: string;
};

export type Cliente = {
  id: string;
  nome: string;
  entidadeGLPI: string;
};

export type TipoChamado = {
  categoria: string;
  subcategoria?: string;
};

export type StatusInterno =
  | "triagem"
  | "a_fazer_hoje"
  | "em_tratativa"
  | "aguardando_terceiro"
  | "aguardando_gestor"
  | "concluido";

export type Prioridade = "baixa" | "media" | "alta" | "critica";

export type TipoMovimentacao =
  | "atribuicao"
  | "mudanca_status"
  | "snooze"
  | "observacao"
  | "vinculacao_projeto";

export type Movimentacao = {
  id: string;
  data: Date;
  usuarioId: string;
  tipo: TipoMovimentacao;
  descricao: string;
  motivo?: string;
};

export type Chamado = {
  id: string;
  titulo: string;
  clienteId: string;
  tipoChamado: TipoChamado;
  tecnicoId: string | null;
  dataAbertura: Date;
  dataUltimaAtualizacao: Date;
  statusInterno: StatusInterno;
  prioridade: Prioridade;
  snoozeAte: Date | null;
  snoozeMotivo: string | null;
  projetoId: string | null;
  observacoesInternas: string;
  historicoMovimentacoes: Movimentacao[];
};

export type TipoProjeto = "entrega_link" | "cancelamento";

export type FrequenciaAtualizacao =
  | "diaria"
  | "a_cada_2_dias"
  | "semanal"
  | "quinzenal"
  | "conforme_necessario";

export const ETAPAS_ENTREGA = [
  "Solicitado",
  "Precificação",
  "Validação Comercial",
  "Aguardando Viabilidade",
  "Agendado",
  "Instalado",
  "Entregue",
] as const;

export const ETAPAS_CANCELAMENTO = [
  "Solicitado",
  "Consulta de Multa",
  "Análise Interna",
  "Autorização Cliente",
  "Em Execução",
  "Concluído",
] as const;

export type EtapaEntrega = (typeof ETAPAS_ENTREGA)[number];
export type EtapaCancelamento = (typeof ETAPAS_CANCELAMENTO)[number];

export type TipoEventoProjeto =
  | "criacao"
  | "mudanca_etapa"
  | "chamado_adicionado"
  | "chamado_removido"
  | "atualizacao_registrada"
  | "observacao"
  | "edicao";

export type EventoProjeto = {
  id: string;
  data: Date;
  usuarioId: string;
  tipo: TipoEventoProjeto;
  descricao: string;
};

export type Projeto = {
  id: string;
  nome: string;
  clienteId: string;
  tipo: TipoProjeto;
  etapaAtual: string;
  prazoPrometido: Date | null;
  chamadosVinculados: string[];
  observacoes: string;
  dataCriacao: Date;
  dataConclusao?: Date | null;
  dataInstalacao?: Date | null;
  frequenciaAtualizacao?: FrequenciaAtualizacao;
  ultimaAtualizacaoRegistrada?: Date | null;
  arquivado?: boolean;
  historico?: EventoProjeto[];
};

export type Script = {
  id: string;
  nome: string;
  tipoChamadoCategoria: string;
  conteudo: string;
  tags: string[];
};

export type StatusVisual = "verde" | "amarelo" | "vermelho" | "cinza";

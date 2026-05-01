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
};

export type Script = {
  id: string;
  nome: string;
  tipoChamadoCategoria: string;
  conteudo: string;
  tags: string[];
};

export type StatusVisual = "verde" | "amarelo" | "vermelho" | "cinza";

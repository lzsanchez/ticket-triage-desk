import type { Script } from "@/types";

export const mockScripts: Script[] = [
  {
    id: "script-instalacao-acompanhamento",
    nome: "Acompanhamento de Instalação",
    tipoChamadoCategoria: "Instalação",
    conteudo:
      "Olá, {cliente}.\n\nReferente ao chamado #{id_chamado}, informamos que a instalação está em andamento junto à operadora. " +
      "Próxima previsão de atualização: {data_proxima_atualizacao}.\n\nQualquer dúvida, estamos à disposição.\n\nEquipe Mobit.",
    tags: ["acompanhamento", "instalacao", "operadora"],
  },
  {
    id: "script-cancelamento-multa",
    nome: "Resposta de Consulta de Multa",
    tipoChamadoCategoria: "Consulta de Multa e Cancelamento",
    conteudo:
      "Olá, {cliente}.\n\nReferente ao chamado #{id_chamado}, segue o cálculo de multa contratual para o cancelamento solicitado:\n\n" +
      "- Valor da multa: {valor_multa}\n- Fim de fidelidade: {data_fim_fidelidade}\n\n" +
      "Confirme se deseja prosseguir com o cancelamento.\n\nEquipe Mobit.",
    tags: ["cancelamento", "multa", "contrato"],
  },
  {
    id: "script-duvida-link-dados",
    nome: "Esclarecimento de Dúvida - Link de Dados",
    tipoChamadoCategoria: "Dúvida",
    conteudo:
      "Olá, {cliente}.\n\nReferente ao chamado #{id_chamado}, segue o esclarecimento sobre seu link de dados:\n\n" +
      "- Velocidade contratada: {velocidade}\n- Tipo de link: {tipo_link}\n- SLA: {sla}\n\n" +
      "Qualquer dúvida adicional, estamos à disposição.\n\nEquipe Mobit.",
    tags: ["duvida", "link-dados", "esclarecimento"],
  },
  {
    id: "script-reparo-tecnico-abertura",
    nome: "Abertura de Reparo Técnico",
    tipoChamadoCategoria: "Reparo Técnico",
    conteudo:
      "Olá, {cliente}.\n\nRecebemos o chamado #{id_chamado} referente à instabilidade no link. " +
      "Já abrimos o reparo técnico junto à operadora sob protocolo {protocolo_operadora}.\n\n" +
      "Acompanharemos até a normalização. Tempo estimado: {tempo_estimado}.\n\nEquipe Mobit.",
    tags: ["reparo", "incidente", "operadora"],
  },
];

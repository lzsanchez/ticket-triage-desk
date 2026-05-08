/**
 * Gerador de planilha Excel — ctrl+desk
 * Uso: npx tsx --tsconfig tsconfig.scripts.json scripts/gerar-excel.ts
 * Saída: ctrl-desk.xlsx (na raiz do projeto)
 */

import * as XLSX from "xlsx";
import { mockChamados } from "../src/data/mockChamados";
import { mockClientes } from "../src/data/mockClientes";
import { mockProjetos } from "../src/data/mockProjetos";

// ─── helpers ────────────────────────────────────────────────────────────────

const HOJE = new Date();

function diasDesde(data: Date): number {
  return Math.max(0, Math.floor((HOJE.getTime() - data.getTime()) / (1000 * 60 * 60 * 24)));
}

function statusVisual(c: (typeof mockChamados)[0]): string {
  if (c.verMaisTardeAte && c.verMaisTardeAte.getTime() > HOJE.getTime()) return "cinza";
  const dias = diasDesde(c.dataUltimaAtualizacao);
  if (dias <= 3) return "verde";
  if (dias <= 7) return "amarelo";
  return "vermelho";
}

function fmtData(d: Date): string {
  return d.toLocaleDateString("pt-BR");
}

const TECNICO_NOME: Record<string, string> = {
  luciano: "Luciano",
  pedro: "Pedro",
  priscila: "Priscila",
};

const PRIORIDADE_LABEL: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};

const STATUS_LABEL: Record<string, string> = {
  triagem: "Triagem",
  a_fazer_hoje: "A fazer hoje",
  em_tratativa: "Em tratativa",
  aguardando_terceiro: "Aguardando terceiro",
  aguardando_gestor: "Aguardando gestor",
  ver_mais_tarde: "Ver mais tarde",
  concluido: "Concluído",
};

// ─── cores ────────────────────────────────────────────────────────────────────

// ARGB hex colors para SheetJS
const COR = {
  verde:    "FFD1FAE5",   // green-100
  amarelo:  "FFFEF3C7",   // amber-100
  vermelho: "FFFEE2E2",   // red-100
  cinza:    "FFF1F5F9",   // slate-100
  critica:  "FFFEE2E2",
  alta:     "FFFEF3C7",
  media:    "FFEFF6FF",   // blue-50
  baixa:    "FFF8FAFC",   // slate-50
  header:   "FF1E3A8A",   // navy
  branco:   "FFFFFFFF",
};

function cellFill(argb: string) {
  return { patternType: "solid", fgColor: { argb } };
}

function headerStyle() {
  return {
    font: { bold: true, color: { argb: COR.branco }, sz: 11 },
    fill: cellFill(COR.header),
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: {
      bottom: { style: "thin", color: { argb: "FF94A3B8" } },
    },
  };
}

function applyHeaders(ws: XLSX.WorkSheet, headers: string[], row = 1) {
  headers.forEach((h, i) => {
    const addr = XLSX.utils.encode_cell({ r: row - 1, c: i });
    if (!ws[addr]) ws[addr] = { v: h, t: "s" };
    ws[addr].s = headerStyle();
  });
}

function setColWidths(ws: XLSX.WorkSheet, widths: number[]) {
  ws["!cols"] = widths.map((w) => ({ wch: w }));
}

// ─── ABA 1: Chamados ─────────────────────────────────────────────────────────

function buildChamadosSheet(): XLSX.WorkSheet {
  const rows = mockChamados.map((c) => {
    const cliente = mockClientes.find((x) => x.id === c.clienteId);
    const aging = diasDesde(c.dataAbertura);
    const semUpdate = diasDesde(c.dataUltimaAtualizacao);
    const sv = statusVisual(c);
    const verMaisTarde = c.verMaisTardeAte && c.verMaisTardeAte.getTime() > HOJE.getTime()
      ? fmtData(c.verMaisTardeAte) + (c.verMaisTardeMotivo ? ` (${c.verMaisTardeMotivo})` : "")
      : "";
    return {
      ID: c.id,
      Título: c.titulo,
      Cliente: cliente?.nome ?? c.clienteId,
      Técnico: TECNICO_NOME[c.tecnicoId ?? ""] ?? (c.tecnicoId ?? "—"),
      "Status interno": STATUS_LABEL[c.statusInterno] ?? c.statusInterno,
      "Status visual": sv.charAt(0).toUpperCase() + sv.slice(1),
      Prioridade: PRIORIDADE_LABEL[c.prioridade] ?? c.prioridade,
      Abertura: fmtData(c.dataAbertura),
      "Última atualiz.": fmtData(c.dataUltimaAtualizacao),
      "Aging (d)": aging,
      "Sem update (d)": semUpdate,
      Projeto: c.projetoId ?? "",
      "Ver mais tarde": verMaisTarde,
      Tipo: c.tipoChamado.categoria,
      Subtipo: c.tipoChamado.subcategoria ?? "",
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);

  // larguras das colunas
  setColWidths(ws, [14, 52, 28, 12, 22, 14, 12, 12, 14, 10, 14, 28, 38, 36, 36]);

  // cabeçalhos com estilo
  applyHeaders(ws, Object.keys(rows[0]));

  // freeze primeira linha
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };

  // congelar primeira linha e aplicar autofilter
  ws["!autofilter"] = { ref: ws["!ref"] ?? "A1" };

  // colorir linhas por status visual
  const svColIndex = 5; // "Status visual" (0-based)
  mockChamados.forEach((c, i) => {
    const sv = statusVisual(c);
    const rowColor = COR[sv as keyof typeof COR] ?? COR.branco;
    const svCell = XLSX.utils.encode_cell({ r: i + 1, c: svColIndex });
    if (ws[svCell]) {
      ws[svCell].s = {
        fill: cellFill(rowColor),
        font: { bold: true },
        alignment: { horizontal: "center" },
      };
    }
    // colorir prioridade
    const prioColIndex = 6;
    const prioCell = XLSX.utils.encode_cell({ r: i + 1, c: prioColIndex });
    if (ws[prioCell]) {
      const pCor =
        c.prioridade === "critica" ? COR.critica :
        c.prioridade === "alta"    ? COR.amarelo :
        c.prioridade === "media"   ? COR.media   :
        COR.baixa;
      ws[prioCell].s = {
        fill: cellFill(pCor),
        alignment: { horizontal: "center" },
      };
    }
  });

  return ws;
}

// ─── ABA 2: Clientes ─────────────────────────────────────────────────────────

function buildClientesSheet(): XLSX.WorkSheet {
  const chamadosPorCliente: Record<string, number> = {};
  mockChamados.forEach((c) => {
    chamadosPorCliente[c.clienteId] = (chamadosPorCliente[c.clienteId] ?? 0) + 1;
  });

  const rows = mockClientes.map((c) => ({
    ID: c.id,
    Nome: c.nome,
    "Entidade GLPI": c.entidadeGLPI,
    "Chamados ativos": chamadosPorCliente[c.id] ?? 0,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  setColWidths(ws, [24, 36, 64, 16]);
  applyHeaders(ws, Object.keys(rows[0]));
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };
  return ws;
}

// ─── ABA 3: Projetos ─────────────────────────────────────────────────────────

function buildProjetosSheet(): XLSX.WorkSheet {
  const rows = mockProjetos.map((p) => {
    const cliente = mockClientes.find((c) => c.id === p.clienteId);
    const diasPrazo = p.prazoPrometido
      ? Math.floor((p.prazoPrometido.getTime() - HOJE.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    return {
      ID: p.id,
      Nome: p.nome,
      Cliente: cliente?.nome ?? p.clienteId,
      Tipo: p.tipo === "entrega_link" ? "Entrega de Link" : "Cancelamento",
      "Etapa atual": p.etapaAtual,
      Prazo: p.prazoPrometido ? fmtData(p.prazoPrometido) : "—",
      "Dias p/ prazo": diasPrazo ?? "—",
      "Chamados vinculados": p.chamadosVinculados.length,
      "Freq. atualização": p.frequenciaAtualizacao ?? "",
      "Última atualiz.": p.ultimaAtualizacaoRegistrada ? fmtData(p.ultimaAtualizacaoRegistrada) : "—",
      Observações: p.observacoes,
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  setColWidths(ws, [28, 48, 24, 18, 26, 12, 14, 20, 20, 16, 60]);
  applyHeaders(ws, Object.keys(rows[0]));
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };

  // colorir dias p/ prazo
  mockProjetos.forEach((p, i) => {
    const diasPrazo = p.prazoPrometido
      ? Math.floor((p.prazoPrometido.getTime() - HOJE.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    const col = 6; // "Dias p/ prazo"
    const cell = XLSX.utils.encode_cell({ r: i + 1, c: col });
    if (ws[cell] && diasPrazo !== null) {
      const cor = diasPrazo < 0 ? COR.vermelho : diasPrazo <= 7 ? COR.amarelo : COR.verde;
      ws[cell].s = { fill: cellFill(cor), font: { bold: true }, alignment: { horizontal: "center" } };
    }
  });

  return ws;
}

// ─── ABA 4: Dashboard ────────────────────────────────────────────────────────

function buildDashboardSheet(): XLSX.WorkSheet {
  const ativos = mockChamados.filter((c) => c.statusInterno !== "concluido");

  // por técnico
  const tecnicos = ["luciano", "pedro", "priscila"];
  const porTecnico = tecnicos.map((t) => {
    const meus = ativos.filter((c) => c.tecnicoId === t);
    const verdes   = meus.filter((c) => statusVisual(c) === "verde").length;
    const amarelos = meus.filter((c) => statusVisual(c) === "amarelo").length;
    const vermelhos= meus.filter((c) => statusVisual(c) === "vermelho").length;
    const cinzas   = meus.filter((c) => statusVisual(c) === "cinza").length;
    return {
      Técnico: TECNICO_NOME[t],
      Total: meus.length,
      "🟢 Verde": verdes,
      "🟡 Amarelo": amarelos,
      "🔴 Vermelho": vermelhos,
      "⚪ Cinza": cinzas,
      "Críticos": meus.filter((c) => c.prioridade === "critica").length,
      "Parados > 7d": meus.filter((c) => diasDesde(c.dataUltimaAtualizacao) > 7).length,
    };
  });

  // por status
  const statusKeys = ["triagem","a_fazer_hoje","em_tratativa","aguardando_terceiro","aguardando_gestor","ver_mais_tarde","concluido"];
  const porStatus = statusKeys.map((s) => ({
    Status: STATUS_LABEL[s],
    Total: mockChamados.filter((c) => c.statusInterno === s).length,
  }));

  // por prioridade
  const prioridades = ["critica","alta","media","baixa"];
  const porPrioridade = prioridades.map((p) => ({
    Prioridade: PRIORIDADE_LABEL[p],
    Total: ativos.filter((c) => c.prioridade === p).length,
  }));

  // monta sheet manualmente
  const ws: XLSX.WorkSheet = {};

  // Seção por técnico
  ws["A1"] = { v: "VISÃO POR TÉCNICO", t: "s", s: headerStyle() };
  const tHeaders = Object.keys(porTecnico[0]);
  tHeaders.forEach((h, i) => {
    const addr = XLSX.utils.encode_cell({ r: 1, c: i });
    ws[addr] = { v: h, t: "s", s: headerStyle() };
  });
  porTecnico.forEach((row, ri) => {
    Object.values(row).forEach((val, ci) => {
      const addr = XLSX.utils.encode_cell({ r: ri + 2, c: ci });
      ws[addr] = { v: val, t: typeof val === "number" ? "n" : "s" };
    });
  });

  // Seção por status (offset col 10)
  const STATUS_OFF = 10;
  ws[XLSX.utils.encode_cell({ r: 0, c: STATUS_OFF })] = { v: "CHAMADOS POR STATUS", t: "s", s: headerStyle() };
  ["Status","Total"].forEach((h, i) => {
    ws[XLSX.utils.encode_cell({ r: 1, c: STATUS_OFF + i })] = { v: h, t: "s", s: headerStyle() };
  });
  porStatus.forEach((row, ri) => {
    ws[XLSX.utils.encode_cell({ r: ri + 2, c: STATUS_OFF })]     = { v: row.Status, t: "s" };
    ws[XLSX.utils.encode_cell({ r: ri + 2, c: STATUS_OFF + 1 })] = { v: row.Total, t: "n" };
  });

  // Seção por prioridade (offset col 13)
  const PRIO_OFF = 13;
  ws[XLSX.utils.encode_cell({ r: 0, c: PRIO_OFF })] = { v: "CHAMADOS POR PRIORIDADE", t: "s", s: headerStyle() };
  ["Prioridade","Total"].forEach((h, i) => {
    ws[XLSX.utils.encode_cell({ r: 1, c: PRIO_OFF + i })] = { v: h, t: "s", s: headerStyle() };
  });
  porPrioridade.forEach((row, ri) => {
    ws[XLSX.utils.encode_cell({ r: ri + 2, c: PRIO_OFF })]     = { v: row.Prioridade, t: "s" };
    ws[XLSX.utils.encode_cell({ r: ri + 2, c: PRIO_OFF + 1 })] = { v: row.Total, t: "n" };
  });

  // Totais gerais (linha 8)
  ws[XLSX.utils.encode_cell({ r: 8, c: 0 })] = { v: "TOTAL GERAL", t: "s", s: { font: { bold: true } } };
  ws[XLSX.utils.encode_cell({ r: 8, c: 1 })] = { v: ativos.length, t: "n", s: { font: { bold: true } } };
  ws[XLSX.utils.encode_cell({ r: 9, c: 0 })] = { v: "Em triagem", t: "s" };
  ws[XLSX.utils.encode_cell({ r: 9, c: 1 })] = { v: mockChamados.filter((c) => c.statusInterno === "triagem").length, t: "n" };
  ws[XLSX.utils.encode_cell({ r: 10, c: 0 })] = { v: "Parados > 7d", t: "s" };
  ws[XLSX.utils.encode_cell({ r: 10, c: 1 })] = { v: ativos.filter((c) => diasDesde(c.dataUltimaAtualizacao) > 7).length, t: "n" };
  ws[XLSX.utils.encode_cell({ r: 11, c: 0 })] = { v: "Ver mais tarde ativos", t: "s" };
  ws[XLSX.utils.encode_cell({ r: 11, c: 1 })] = { v: ativos.filter((c) => c.verMaisTardeAte && c.verMaisTardeAte > HOJE).length, t: "n" };

  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 12, c: PRIO_OFF + 1 } });
  setColWidths(ws, [24, 8, 10, 12, 12, 10, 10, 14, 4, 4, 26, 8, 4, 20, 8]);

  return ws;
}

// ─── main ─────────────────────────────────────────────────────────────────────

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, buildChamadosSheet(),    "Chamados");
XLSX.utils.book_append_sheet(wb, buildClientesSheet(),    "Clientes");
XLSX.utils.book_append_sheet(wb, buildProjetosSheet(),    "Projetos");
XLSX.utils.book_append_sheet(wb, buildDashboardSheet(),   "Dashboard");

const outputPath = "ctrl-desk.xlsx";
XLSX.writeFile(wb, outputPath, { cellStyles: true });
console.log(`✓ Planilha gerada: ${outputPath}`);
console.log(`  ${mockChamados.length} chamados · ${mockClientes.length} clientes · ${mockProjetos.length} projetos`);

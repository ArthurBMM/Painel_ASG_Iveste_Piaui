// =====================================================================================
// series.js — séries para gráficos (sem DOM): empregados por classe e medida mês a mês
// =====================================================================================
import { valorDe } from "./registro.js";

/**
 * Empregados (estoque no fim do mês) por classe, mês a mês, respeitando os filtros do contexto
 * (a classe selecionada é ignorada aqui de propósito: o gráfico mostra TODAS as classes).
 */
export function empregadosPorClasseMes(ctx, classes = ["Verde", "Neutra", "Alto impacto"]) {
  const meses = [...ctx.meses].sort();
  const rows = ctx.linhas("emprego_mensal", ["classe"]);
  const idx = new Map(meses.map((m, i) => [m, i]));
  const series = classes.map((nome) => ({ nome, valores: meses.map(() => 0) }));
  const ocup = ctx.modelo.ocupacoes;
  for (const r of rows) {
    const k = classes.indexOf(ocup.get(r.ocupacao_id)?.classe);
    if (k >= 0) series[k].valores[idx.get(r.mes.slice(0, 7))] += r.empregados_fim_mes;
  }
  return { meses, series };
}

/**
 * Uma medida do registro calculada mês a mês: para cada mês, um contexto de período = aquele mês.
 * Medidas "por ano" (taxas, intensidades) ficam anualizadas por mês (fator 12), então a linha é
 * comparável ao valor anual. Meses sem dado voltam null (o gráfico interrompe a linha).
 */
export function medidaMesAMes(registro, ref, ctx) {
  const meses = [...ctx.meses].sort();
  return { meses, valores: meses.map((m) => valorDe(registro, ref, ctx.derivar({ periodo: { de: m, ate: m } }))) };
}

/** Uma ou mais medidas por ano civil (para indicadores só anuais, como os de governança). */
export function medidasPorAno(registro, refs, ctx) {
  const anos = [...ctx.anos].sort();
  return {
    anos,
    linhas: refs.map((ref) => ({ ref, valores: anos.map((a) => valorDe(registro, ref, ctx.derivar({ periodo: { de: `${a}-01`, ate: `${a}-12` } }))) })),
  };
}

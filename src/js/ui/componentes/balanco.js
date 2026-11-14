// =====================================================================================
// balanco.js — frase-resumo de um pilar: "6 melhoraram · 2 pioraram (de 9 avaliados)"
// Não é nota nem índice: é uma CONTAGEM transparente (decisão do grupo: sem índice sintético).
// =====================================================================================
import { balancoPilar } from "../../nucleo/registro.js";

/** Contexto de um único ano (o selecionado, ou o último do período) para calcular o balanço. */
export function contextoDoBalanco(ctx) {
  const ano = ctx.anos.size === 1 ? [...ctx.anos][0] : Math.max(...ctx.anos);
  return { ano, ctx: ctx.derivar({ periodo: { de: `${ano}-01`, ate: `${ano}-12` } }) };
}

export function htmlBalanco(registro, ctx, pilar, ids = null) {
  const { ano, ctx: c1 } = contextoDoBalanco(ctx);
  const b = balancoPilar(registro, c1, pilar, ids);
  const avaliados = b.total - b.semDado;
  if (!avaliados) return `<div class="balanco">Sem variação calculável para este recorte (${ano} vs ${ano - 1}).</div>`;
  const extra = b.estaveis ? ` · ${b.estaveis} ${b.estaveis === 1 ? "estável" : "estáveis"}` : "";
  return `<div class="balanco"><b class="bom">${b.melhoraram} ${b.melhoraram === 1 ? "melhorou" : "melhoraram"}</b> · <b class="ruim">${b.pioraram} ${b.pioraram === 1 ? "piorou" : "pioraram"}</b>${extra} <span>(de ${avaliados} avaliados, ${ano} vs ${ano - 1})</span></div>`;
}

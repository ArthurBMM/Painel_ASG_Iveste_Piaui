// =====================================================================================
// nota.js — componentes visuais da PONTUAÇÃO (a conta mora em nucleo/pontuacao.js; aqui só se desenha)
//
// Regra de design: a COR nunca é a única informação. Toda nota vem com o rótulo da faixa em texto
// ("Alinhado", "Em atenção", "Crítico", "Sem dados suficientes") e com a cobertura.
// Se não houver config/metricas.json válido, `metricas` é null e nada daqui aparece (o painel segue
// funcionando só com valores e balanço).
// =====================================================================================
import { esc } from "../util.js";

/** "62" (inteiro) ou "–" quando não há nota. */
export const fmtNota = (n) => (n == null ? "–" : String(Math.round(n)));
const fmtPct = (x) => (x == null ? "–" : `${Math.round(x * 100)}%`);
export const rotuloFaixa = (metricas, f) => metricas.rotulos_faixas?.[f] || f;

/** Bloco com a nota de um pilar: número, rótulo da faixa, cobertura e barra. */
export function htmlNotaPilar(res, metricas, { compacto = false } = {}) {
  if (!metricas || !res) return "";
  const larg = res.nota == null ? 0 : Math.max(0, Math.min(100, res.nota));
  return `<div class="nota-bloco f-${res.faixa}${compacto ? " compacto" : ""}" title="Nota de 0 a 100 (média ponderada dos indicadores com dado). Os parâmetros são hipóteses do grupo; veja Indicadores e método.">
    <div class="nota-num">${fmtNota(res.nota)}<small>/100</small></div>
    <div class="nota-info">
      <span class="faixa">${esc(rotuloFaixa(metricas, res.faixa))}</span>
      <span class="cob">cobertura ${fmtPct(res.cobertura)}${res.total != null ? ` · ${res.avaliados} de ${res.total} indicadores` : ""}</span>
      <div class="nota-barra"><i style="width:${larg}%"></i></div>
    </div></div>`;
}

/** Faixa de destaque da Visão ASG: nota geral + as três notas de pilar. */
export function htmlNotaASG(asg, metricas, registro) {
  if (!metricas || !asg) return "";
  const pilares = ["A", "S", "G"].map((p) => `<div class="nota-mini p-${p}"><span class="nome">${esc(registro.pilares[p].nome)}</span>${htmlNotaPilar(asg[p], metricas, { compacto: true })}</div>`).join("");
  return `<section class="nota-asg">
    <div class="nota-geral"><span class="titulo">Nota ASG</span>${htmlNotaPilar({ ...asg.geral, total: null }, metricas)}</div>
    <div class="nota-pilares">${pilares}</div>
    <p class="nota-aviso">Notas de 0 a 100 calculadas com <b>parâmetros estimados pelo grupo</b> (pesos, pisos e tetos), não com metas oficiais. Todos podem ser alterados em <code>config/metricas.json</code>; a conta passo a passo está em <a href="#metodo">Indicadores e método</a>.</p>
  </section>`;
}

/** Linha de nota dentro do cartão de um indicador: "Nota 64 · peso 3" ou "sem nota". */
export function htmlNotaIndicador(item, foraDaNota) {
  if (foraDaNota) return `<div class="nota-ind sem" title="${esc(foraDaNota.motivo)}">Sem nota: total absoluto, não comparável entre entidades</div>`;
  if (!item) return "";
  if (item.nota == null) return `<div class="nota-ind sem">Sem dado neste recorte, fora da nota</div>`;
  return `<div class="nota-ind"><div class="nota-barra"><i style="width:${Math.max(0, Math.min(100, item.nota))}%"></i></div><span>Nota <b>${fmtNota(item.nota)}</b> · peso ${item.peso}</span></div>`;
}

/** Quatro notas pequenas (A, S, G e geral) para uma linha da tabela de entidades. */
export function htmlNotasLinha(asg, metricas) {
  if (!metricas || !asg) return "";
  const f = (k, r, rot) => `<span class="n f-${r.faixa}" title="${rot}: ${esc(rotuloFaixa(metricas, r.faixa))}, cobertura ${fmtPct(r.cobertura)}"><i>${k}</i> ${fmtNota(r.nota)}</span>`;
  return `<div class="sel-notas">${f("A", asg.A, "Ambiental")}${f("S", asg.S, "Social")}${f("G", asg.G, "Governança")}<span class="n geral f-${asg.geral.faixa}" title="ASG geral: ${esc(rotuloFaixa(metricas, asg.geral.faixa))}"><i>ASG</i> ${fmtNota(asg.geral.nota)}</span></div>`;
}

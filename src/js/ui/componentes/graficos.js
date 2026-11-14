// =====================================================================================
// graficos.js — gráficos em SVG puro (sem biblioteca)
//
// Por que SVG à mão e não Chart.js? (1) funciona offline na apresentação, sem CDN; (2) cabe em
// poucas linhas; (3) o grupo pode trocar por Chart.js depois: só este arquivo muda, porque as
// páginas chamam renderGrafico(spec, ...) e não sabem como o desenho é feito.
// =====================================================================================
import { esc, rotuloMes } from "../util.js";
import { formatarValor } from "../../nucleo/formato.js";
import { empregadosPorClasseMes, medidaMesAMes, medidasPorAno } from "../../nucleo/series.js";
import { resolverRef } from "../../nucleo/registro.js";

export const COR_CLASSE = { Verde: "#00704A", Neutra: "#2A78D6", "Alto impacto": "#E2741F" };
const COR_PILAR = { A: "#00704A", S: "#2A78D6", G: "#1D4E63" };

/** Escolhe 4–5 marcas "redondas" para o eixo Y. */
function ticksBonitos(min, max, n = 4) {
  if (min === max) { max = min + 1; }
  const bruto = (max - min) / n, mag = 10 ** Math.floor(Math.log10(bruto));
  const passo = [1, 2, 2.5, 5, 10].map((f) => f * mag).find((p) => p >= bruto);
  const ini = Math.floor(min / passo) * passo, fim = Math.ceil(max / passo) * passo, t = [];
  for (let v = ini; v <= fim + passo / 1e6; v += passo) t.push(Number(v.toPrecision(12)));
  return t;
}

/**
 * Gráfico de linhas.
 * @param {{meses:string[], series:{nome:string,cor:string,valores:(number|null)[]}[], formato:object, marcas?:{mes:string,texto:string}[], descricao:string}} cfg
 */
export function linhasSVG({ meses, series, formato, marcas = [], descricao, largo = false }) {
  const W = largo ? 1240 : 640, H = largo ? 300 : 260, ml = 52, mr = 26, mt = 14, mb = 28, n = meses.length;
  const todos = series.flatMap((s) => s.valores).filter((v) => v != null && Number.isFinite(v));
  if (!todos.length) return `<p class="sub">Sem dados para este recorte.</p>`;
  let min = Math.min(...todos), max = Math.max(...todos);
  if (min >= 0 && (max - min) / (max || 1) > 0.15) min = 0;          // linha de base em zero quando não distorce
  const ticks = ticksBonitos(min, max); min = ticks[0]; max = ticks[ticks.length - 1];
  const x = (i) => ml + (n === 1 ? (W - ml - mr) / 2 : (i * (W - ml - mr)) / (n - 1));
  const y = (v) => mt + (1 - (v - min) / (max - min)) * (H - mt - mb);

  const passoX = n <= 14 ? 1 : n <= 30 ? 3 : 6;
  const eixoX = meses.map((m, i) => ((Number(m.slice(5, 7)) - 1) % passoX === 0 ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${rotuloMes(m)}</text>` : "")).join("");
  // casas decimais do eixo Y: só as necessárias para os rótulos não se repetirem (ex.: 30%, 20% e não 30,0%)
  const fator = formato.tipo === "percentual" ? 100 : 1, passoExib = Math.abs((ticks[1] - ticks[0]) * fator);
  const casasY = Number.isInteger(Number(passoExib.toFixed(6))) ? 0 : passoExib * 10 % 1 < 1e-6 ? 1 : 2;
  const eixoY = ticks.map((t) => `<line class="grade-y" x1="${ml}" x2="${W - mr}" y1="${y(t)}" y2="${y(t)}"/><text x="${ml - 6}" y="${y(t) + 4}" text-anchor="end">${esc(formatarValor(t, { ...formato, casas: casasY, unidade: "" }))}</text>`).join("");

  const linhas = series.map((s) => {
    let d = "", aberto = false;
    s.valores.forEach((v, i) => { if (v == null || !Number.isFinite(v)) { aberto = false; return; } d += `${aberto ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)} `; aberto = true; });
    const pontos = s.valores.map((v, i) => (v == null ? "" : `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="5" fill="transparent"><title>${esc(s.nome)} · ${rotuloMes(meses[i])}: ${esc(formatarValor(v, formato))}</title></circle>`)).join("");
    return `<path d="${d}" fill="none" stroke="${s.cor}" stroke-width="2.2" stroke-linejoin="round"/>${pontos}`;
  }).join("");

  const marcasSVG = marcas.map((mk) => {
    const i = meses.indexOf(mk.mes); if (i < 0) return "";
    return `<line x1="${x(i)}" x2="${x(i)}" y1="${mt}" y2="${H - mb}" stroke="#8a8f8c" stroke-dasharray="4 3"/><text x="${x(i) + 4}" y="${mt + 10}">${esc(mk.texto)}</text>`;
  }).join("");

  const legenda = series.length > 1 || series[0].nome ? `<div class="legenda">${series.map((s) => `<span><i style="background:${s.cor}"></i>${esc(s.nome)}</span>`).join("")}</div>` : "";
  return `<div class="grafico"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(descricao)}">${eixoY}<line class="eixo" x1="${ml}" x2="${W - mr}" y1="${H - mb}" y2="${H - mb}"/>${eixoX}${marcasSVG}${linhas}</svg>${legenda}</div>`;
}

/**
 * Renderiza um gráfico descrito em tema.json -> graficos.
 * tipos: "classes" (empregados por classe), "medida" (medidas do registro mês a mês), "anual" (tabela por ano)
 */
export function renderGrafico(spec, { registro, ctx, tema }) {
  const classe = spec.larga ? "caixa larga" : "caixa";
  ctx = ctx.derivar({ periodo: {} });   // gráficos de tendência mostram o período INTEIRO, mesmo com um ano selecionado
  const cab = `<h3>${esc(spec.titulo)}</h3><p class="sub">${esc(spec.sub || "")}</p>`;
  const marcas = tema.marcas || [];
  if (spec.tipo === "classes") {
    const { meses, series } = empregadosPorClasseMes(ctx);
    const g = linhasSVG({ meses, series: series.map((s) => ({ ...s, cor: COR_CLASSE[s.nome] })), formato: { tipo: "numero", casas: 0 }, marcas, descricao: spec.titulo, largo: !!spec.larga });
    return `<div class="${classe}">${cab}${g}</div>`;
  }
  if (spec.tipo === "medida") {
    const ss = spec.refs.map((ref) => {
      const { ind, medida } = resolverRef(registro, ref), mm = medidaMesAMes(registro, ref, ctx);
      return { meses: mm.meses, nome: medida.titulo, cor: COR_PILAR[ind.pilar], valores: mm.valores, formato: medida.formato };
    });
    const g = linhasSVG({ meses: ss[0].meses, series: ss, formato: ss[0].formato, marcas, descricao: spec.titulo, largo: !!spec.larga });
    return `<div class="${classe}">${cab}${g}</div>`;
  }
  if (spec.tipo === "anual") {
    const { anos, linhas } = medidasPorAno(registro, spec.refs, ctx);
    const cabTab = `<tr><th>Indicador</th>${anos.map((a) => `<th class="num">${a}</th>`).join("")}</tr>`;
    const corpo = linhas.map((l) => { const { ind, medida } = resolverRef(registro, l.ref); return `<tr><td>${esc(ind.id)} · ${esc(medida.titulo)}</td>${l.valores.map((v) => `<td class="num">${esc(formatarValor(v, medida.formato))}</td>`).join("")}</tr>`; }).join("");
    return `<div class="${classe}">${cab}<div class="rolagem"><table>${cabTab}${corpo}</table></div></div>`;
  }
  return "";
}

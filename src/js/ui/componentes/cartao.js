// =====================================================================================
// cartao.js — o "cartão" de um indicador (valor + variação + referência GRI)
// Todos os componentes de UI recebem dados prontos e devolvem uma STRING de HTML.
// =====================================================================================
import { resolverRef, variacao } from "../../nucleo/registro.js";
import { formatarValor, formatarDelta } from "../../nucleo/formato.js";
import { anoSelecionado } from "../../nucleo/contexto.js";
import { esc } from "../util.js";

/** Chips com a referência GRI: "GRI 305-1" (+ página, se o catálogo privado estiver carregado). O mouse mostra o título. */
export function chipsGRI(ind) {
  // com o catálogo privado carregado: código + página (e título no mouse); sem ele: só o código
  return ind.referencias.map((r) => `<span class="chip"${r.titulo ? ` title="${esc((r.norma || "") + " — " + r.titulo)}"` : ""}>${esc(r.rotulo)}${r.pagina ? ` · p. ${r.pagina}` : ""}</span>`).join("");
}

/**
 * Cartão compacto.
 * @param ref "EV1" (medida principal) ou "EV1.alto_impacto"
 */
export function cartao(registro, ref, ctx, { mostrarGRI = true } = {}) {
  const { ind, medida } = resolverRef(registro, ref);
  const v = variacao(ind, medida, ctx);
  const ano = anoSelecionado(ctx);
  const delta = v.delta == null ? "" : `<span class="${v.classe}">${esc(formatarDelta(v.delta, medida.formato))}</span> <small>vs ${ano - 1}</small>`;
  return `<article class="cartao p-${ind.pilar}">
    <div class="rotulo">${esc(medida.titulo)}</div>
    <div class="valor">${esc(formatarValor(v.atual, medida.formato))}</div>
    <div class="delta ${v.classe}">${delta}</div>
    ${mostrarGRI ? `<div class="chips">${chipsGRI(ind)}${ind.cobertura === "parcial" ? '<span class="chip parcial">cobertura parcial</span>' : ""}</div>` : ""}
  </article>`;
}

/** Cartão grande de um indicador inteiro (páginas de pilar), com valores secundários e explicação. */
export function cartaoIndicador(registro, ind, ctx) {
  const prin = ind.principal;
  const v = variacao(ind, prin, ctx);
  const ano = anoSelecionado(ctx);
  const delta = v.delta == null ? "" : `<span class="delta ${v.classe}">${esc(formatarDelta(v.delta, prin.formato))} <small>vs ${ano - 1}</small></span>`;
  const outras = ind.medidas.filter((m) => m !== prin).map((m) => {
    const vm = variacao(ind, m, ctx);
    const d = vm.delta == null ? "" : ` <span class="delta ${vm.classe}">${esc(formatarDelta(vm.delta, m.formato))}</span>`;
    return `<li><span>${esc(m.titulo)}</span><b>${esc(formatarValor(vm.atual, m.formato))}${d}</b></li>`;
  }).join("");
  return `<article class="indicador p-${ind.pilar}">
    <div class="cod">${esc(ind.id)}</div>
    <h3>${esc(ind.titulo)}</h3>
    <div class="principal"><span class="valor">${esc(formatarValor(v.atual, prin.formato))}</span>${delta}<span class="rot">${esc(prin.titulo)}</span></div>
    ${outras ? `<ul class="outras">${outras}</ul>` : ""}
    <div class="chips">${chipsGRI(ind)}${ind.cobertura === "parcial" ? '<span class="chip parcial">cobertura parcial</span>' : ""}</div>
    <details class="info"><summary>ⓘ Por que importa para ASG e como é calculado</summary>
      <p><b>Por que importa.</b> ${esc(ind.por_que_asg)}</p>
      <p><b>Como é calculado.</b> ${esc(ind.como_calcula)}</p></details>
  </article>`;
}
